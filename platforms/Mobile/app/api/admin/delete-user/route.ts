import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, adminUserId } = await request.json()

    // Validazione
    if (!userId) {
      return NextResponse.json({ error: 'userId obbligatorio' }, { status: 400 })
    }

    // Verifica che chi chiama sia l'admin
    if (adminUserId !== '3740d43e-4020-4020-8582-ad305f9d06b4') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Non permettere di eliminare se stesso
    if (userId === '3740d43e-4020-4020-8582-ad305f9d06b4') {
      return NextResponse.json({ error: 'Non puoi eliminare il tuo account admin' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configurazione server mancante' }, { status: 500 })
    }

    // Client admin con service_role key (bypassa RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Elimina permessi
    await supabaseAdmin.from('user_permissions').delete().eq('user_id', userId)

    // 2. Elimina profilo
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 3. Elimina utente da auth.users (questo elimina tutto grazie a ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Supabase deleteUser error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 })
  }
}
