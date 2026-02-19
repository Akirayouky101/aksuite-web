import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, adminUserId } = await request.json()

    // Validazione
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password e nome sono obbligatori' }, { status: 400 })
    }

    // Verifica che chi chiama sia l'admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configurazione server mancante' }, { status: 500 })
    }

    // Client admin con service_role key (bypassa RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verifica che l'admin sia autorizzato
    if (adminUserId !== '3740d43e-4020-4020-8582-ad305f9d06b4') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Crea utente con admin API (non cambia la sessione corrente)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Conferma automatica, niente email di verifica
      user_metadata: { full_name: fullName }
    })

    if (error) {
      console.error('Supabase createUser error:', error)
      return NextResponse.json({ 
        error: error.message, 
        code: error.status || error.name,
        details: `Email: ${email}, Password length: ${password?.length}` 
      }, { status: 400 })
    }

    // Crea il profilo nella tabella profiles
    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        created_at: new Date().toISOString()
      })

      // Crea permessi vuoti (il trigger potrebbe non scattare con admin.createUser)
      await supabaseAdmin.from('user_permissions').upsert({
        user_id: data.user.id,
        is_admin: false,
        can_calls: false,
        can_lavorazioni: false,
        can_tasks: false,
        can_calendar: false,
        can_budget: false,
        can_passwords: false,
        can_notes: false,
        can_clients: false,
        can_visits: false,
        can_suppliers: false,
        can_orders: false,
        can_warehouse: false,
        can_preventivi: false,
      })

      // Aggiungi ai team_members solo se non esiste già un membro con nome simile
      try {
        const firstName = fullName.split(' ')[0].toUpperCase()
        const { data: existing } = await supabaseAdmin
          .from('team_members')
          .select('id, name')
          .eq('user_id', adminUserId)
        
        const alreadyExists = (existing || []).some((m: any) => 
          m.name.toUpperCase() === fullName.toUpperCase() || 
          m.name.toUpperCase() === firstName
        )
        
        if (!alreadyExists) {
          await supabaseAdmin.from('team_members').insert({
            user_id: adminUserId,
            name: fullName,
            role: '',
          })
        }
      } catch { /* ignora errori */ }
    }

    return NextResponse.json({
      success: true,
      user: { id: data.user?.id, email: data.user?.email }
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 })
  }
}
