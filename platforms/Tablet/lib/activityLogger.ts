import { supabase } from '@/lib/supabase'

// Funzione standalone per loggare attivita' (importabile ovunque)
export async function logActivity(
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityName: string,
  details?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    await supabase.from('activity_logs').insert([{
      user_id: user.id,
      user_name: profile?.full_name || user.user_metadata?.full_name || 'Utente',
      user_email: profile?.email || user.email || '',
      action,
      entity_type: entityType,
      entity_name: entityName,
      details: details || '',
    }])
  } catch {
    // Non bloccare mai l'operazione principale
  }
}
