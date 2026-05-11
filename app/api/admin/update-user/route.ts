import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName, password, adminUserId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId obbligatorio' }, { status: 400 })
    }
    if (adminUserId !== '3740d43e-4020-4020-8582-ad305f9d06b4') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configurazione server mancante' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Aggiorna auth.users (email e/o password)
    const authUpdate: any = {}
    if (email) authUpdate.email = email
    if (password) authUpdate.password = password
    if (fullName) authUpdate.user_metadata = { full_name: fullName }

    if (Object.keys(authUpdate).length > 0) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdate)
      if (authErr) {
        return NextResponse.json({ error: authErr.message }, { status: 400 })
      }
    }

    // Aggiorna profiles (upsert per gestire utenti senza riga in profiles)
    const profileUpdate: any = { id: userId }
    if (email) profileUpdate.email = email
    if (fullName) profileUpdate.full_name = fullName
    if (Object.keys(profileUpdate).length > 1) {
      await supabaseAdmin.from('profiles').upsert(profileUpdate, { onConflict: 'id' })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 })
  }
}
