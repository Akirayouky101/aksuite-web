import type { SupabaseClient } from '@supabase/supabase-js'
import {
  CalendarConnection, fromGoogleEvent, GoogleApiError, googleAccessToken, GoogleEvent, googleRequest,
  importedEventId, LocalCalendarEvent, localEventHash, toGoogleEvent,
  stateHash,
} from './googleCalendar'

type Local = LocalCalendarEvent & { updated_at: string }
type Link = { google_event_id: string; local_event_id: string | null; original_event_id: string; local_hash: string; google_etag: string; recurrence: string[]; google_timezone: string }
export type CalendarConflict = { id: string; title: string; reason: string }
export type Resolutions = Record<string, 'local' | 'google'>
export class CalendarBusyError extends Error {
  constructor() { super('Sincronizzazione già in corso. Riprova tra poco.') }
}
class ConflictError extends Error {
  constructor(public conflict: CalendarConflict) { super(conflict.reason) }
}
export async function withGoogleLease<T>(client: SupabaseClient, userId: string, action: (lease: string) => Promise<T>) {
  const { data: lease, error } = await client.rpc('lock_google_calendar', { owner_id: userId })
  if (error) throw error
  if (!lease) throw new CalendarBusyError()
  try { return await action(lease) }
  finally {
    const { error } = await client.from('google_calendar_connections').update({ lease_until: null, lease_id: null }).eq('user_id', userId).eq('lease_id', lease)
    if (error) throw error
  }
}

export async function syncGoogleCalendar(client: SupabaseClient, userId: string, resolutions: Resolutions = {}) {
  return withGoogleLease(client, userId, async lease => {
    const startedAt = Date.now()
    const { data, error } = await client.from('google_calendar_connections').select('*').eq('user_id', userId).single()
    if (error) throw error
    const connection: CalendarConnection = data
    if (!connection.calendar_id) throw new Error('Scegli prima il calendario da sincronizzare.')
    const calendarId = connection.calendar_id
    const base = `calendars/${encodeURIComponent(calendarId)}/events`
    const token = await googleAccessToken(client, connection)
    const conflicts: CalendarConflict[] = []
    const choices = { ...resolutions }
    let pulled = 0; let pushed = 0
    let unfinished = false
    const conflict = (id: string, title: string, reason: string): never => { throw new ConflictError({ id, title, reason }) }
    async function local(id: string | null): Promise<Local | null> {
      if (!id) return null
      const { data, error } = await client.from('events').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
      if (error) throw error
      return data
    }
    async function linkForGoogle(id: string): Promise<Link | null> {
      const { data, error } = await client.from('google_calendar_links').select('*').eq('user_id', userId).eq('calendar_id', calendarId).eq('google_event_id', id).maybeSingle()
      if (error) throw error
      return data
    }
    async function saveLink(remote: GoogleEvent, item: LocalCalendarEvent) {
      const { error } = await client.from('google_calendar_links').upsert({
        user_id: userId, calendar_id: calendarId, google_event_id: remote.id, local_event_id: item.id, original_event_id: item.id,
        local_hash: localEventHash(item), google_etag: remote.etag, recurrence: remote.recurrence || [],
        google_timezone: remote.start?.timeZone || 'Europe/Rome',
      }, { onConflict: 'user_id,calendar_id,google_event_id' })
      if (error) throw error
    }
    async function removeLink(id: string) {
      const { error } = await client.from('google_calendar_links').delete().eq('user_id', userId).eq('calendar_id', calendarId).eq('google_event_id', id)
      if (error) throw error
    }
    async function deleteGoogle(remote: GoogleEvent) {
      try { await googleRequest(token, `${base}/${encodeURIComponent(remote.id)}`, { method: 'DELETE', headers: { 'If-Match': remote.etag } }) }
      catch (cause) { if (!(cause instanceof GoogleApiError && [404, 410].includes(cause.status))) throw cause }
      await removeLink(remote.id); pushed++
    }
    async function writeGoogle(item: Local, existing?: GoogleEvent, recurrence: string[] = [], timeZone = 'Europe/Rome') {
      const payload = toGoogleEvent(item, userId, recurrence, existing?.start?.timeZone || timeZone)
      if (existing?.extendedProperties?.private) payload.extendedProperties.private = { ...existing.extendedProperties.private, ...payload.extendedProperties.private }
      let remote: GoogleEvent
      if (existing && existing.status !== 'cancelled') {
        try {
          remote = await googleRequest(token, `${base}/${encodeURIComponent(existing.id)}`, {
            method: 'PATCH', headers: { 'If-Match': existing.etag }, body: JSON.stringify(payload),
          })
        } catch (cause) {
          if (cause instanceof GoogleApiError && cause.status === 412) conflict(existing.id, item.title, 'Google è cambiato durante il salvataggio. Rileggi e scegli la versione da mantenere.')
          throw cause
        }
      } else {
        if (existing) await removeLink(existing.id)
        const { data: queued, error } = await client.from('google_calendar_outbox').select('target_google_id').eq('user_id', userId).eq('event_id', item.id).maybeSingle()
        if (error) throw error
        let id = queued?.target_google_id || `aksuite${userId.replace(/-/g, '')}${item.id.replace(/-/g, '')}`
        let created: GoogleEvent | null = null
        for (let attempt = 0; attempt < 5; attempt++) {
          const { error: seedError } = await client.from('google_calendar_outbox').upsert({
            user_id: userId, event_id: item.id, target_google_id: id,
          }, { onConflict: 'user_id,event_id', ignoreDuplicates: true })
          if (seedError) throw seedError
          const { error: targetError } = await client.from('google_calendar_outbox').update({ target_google_id: id }).eq('user_id', userId).eq('event_id', item.id)
          if (targetError) throw targetError
          try { created = await googleRequest(token, base, { method: 'POST', body: JSON.stringify({ ...payload, id }) }); break }
          catch (cause) {
            if (!(cause instanceof GoogleApiError && cause.status === 409)) throw cause
            let prior: GoogleEvent
            try { prior = await googleRequest(token, `${base}/${id}`) }
            catch (cause) {
              if (!(cause instanceof GoogleApiError && [404, 410].includes(cause.status))) throw cause
              id = `aksuite${stateHash(id)}`
              continue
            }
            if (prior.status === 'cancelled') { id = `aksuite${stateHash(id)}`; continue }
            if (prior.extendedProperties?.private?.aksuite_user_id !== userId || prior.extendedProperties.private.aksuite_event_id !== item.id) throw new Error('Identificativo evento Google già occupato.')
            if (localEventHash({ ...fromGoogleEvent(prior, userId), id: item.id }) !== localEventHash(item)) {
              if (choices[prior.id] === 'google') { await writeLocal(prior, item); return }
              if (choices[prior.id] !== 'local') conflict(prior.id, item.title, 'L’evento Google esiste già con contenuto diverso. Scegli la versione da mantenere.')
              created = await googleRequest(token, `${base}/${id}`, { method: 'PATCH', headers: { 'If-Match': prior.etag }, body: JSON.stringify(payload) })
            } else {
              await saveLink(prior, item)
              return
            }
            break
          }
        }
        if (!created) throw new Error('Troppi identificativi Google eliminati. Riprova la sincronizzazione.')
        remote = created
      }
      await saveLink(remote, item); pushed++
    }
    async function writeLocal(remote: GoogleEvent, current: Local | null, id?: string) {
      const value = fromGoogleEvent(remote, userId)
      const metadata = remote.extendedProperties?.private
      if (current && (metadata?.aksuite_user_id !== userId || !['true', 'false'].includes(metadata.aksuite_completed))) value.is_completed = Boolean(current.is_completed)
      let item: Local
      if (current) {
        const { data, error } = await client.from('events').update({ ...value, updated_at: new Date().toISOString() })
          .eq('id', current.id).eq('user_id', userId).eq('updated_at', current.updated_at).select().maybeSingle()
        if (error) throw error
        if (!data) conflict(remote.id, value.title, 'AK Suite è cambiata durante la sincronizzazione. Riprova.')
        item = data
      } else {
        const { data, error } = await client.from('events').insert({
          ...value, id: id || importedEventId(userId, calendarId, remote.id), user_id: userId,
          client_id: null, work_item_id: null, client_confirmed: false, color: 'blue', reminder_minutes: 0,
          assigned_to: null, is_shared: false, created_by: userId,
        }).select().single()
        if (error) throw error
        item = data
      }
      await saveLink(remote, item); pulled++
    }
    async function reconcileVersion(remote: GoogleEvent, known?: Link | null) {
      const link = known === undefined ? await linkForGoogle(remote.id) : known
      const choice = choices[remote.id]
      if (!link) {
        if (remote.status === 'cancelled') return
        const privateData = remote.extendedProperties?.private
        const ownId = privateData?.aksuite_user_id === userId && /^[a-f0-9-]{36}$/i.test(privateData.aksuite_event_id || '') ? privateData.aksuite_event_id : null
        const id = ownId || importedEventId(userId, calendarId, remote.id)
        const current = await local(id)
        if (current) {
          const remoteHash = localEventHash({ ...fromGoogleEvent(remote, userId), id })
          if (remoteHash !== localEventHash(current)) {
            if (!choice) conflict(remote.id, current.title, 'Versioni diverse senza un punto di sincronizzazione precedente.')
            if (choice === 'local') { await writeGoogle(current, remote, remote.recurrence); return }
            await writeLocal(remote, current); return
          }
          await saveLink(remote, current); return
        }
        const value = fromGoogleEvent(remote, userId)
        // The initial date limits newly imported history, not edits to previously linked events.
        if (new Date(value.end_date || value.start_date) < new Date(connection.initial_from)) return
        await writeLocal(remote, null, id)
        return
      }
      const current = await local(link.local_event_id)
      const localChanged = !current || localEventHash(current) !== link.local_hash
      const remoteChanged = remote.etag !== link.google_etag || remote.status === 'cancelled'
      if (!current) {
        if (remote.status === 'cancelled') { await removeLink(remote.id); return }
        if (remoteChanged && !choice) conflict(remote.id, remote.summary || 'Evento eliminato', 'Eliminato in AK Suite ma modificato su Google.')
        if (choice === 'google') await writeLocal(remote, null, link.original_event_id)
        else await deleteGoogle(remote)
        return
      }
      if (remote.status === 'cancelled') {
        if (localChanged && !choice) conflict(remote.id, current.title, 'Eliminato su Google ma modificato in AK Suite.')
        if (choice === 'local') { await writeGoogle(current, remote, link.recurrence, link.google_timezone); return }
        const { data, error } = await client.from('events').delete().eq('id', current.id).eq('user_id', userId).eq('updated_at', current.updated_at).select('id').maybeSingle()
        if (error) throw error
        if (!data) conflict(remote.id, current.title, 'AK Suite è cambiata durante l’eliminazione. Riprova.')
        await removeLink(remote.id); pulled++
        return
      }
      if (localChanged && remoteChanged && !choice) conflict(remote.id, current.title, 'Modificato su entrambe le piattaforme.')
      if (choice === 'local' || (localChanged && !remoteChanged)) await writeGoogle(current, remote, link.recurrence, link.google_timezone)
      else if (remoteChanged || choice === 'google') await writeLocal(remote, current)
    }
    async function reconcile(remote: GoogleEvent, known?: Link | null) {
      await reconcileVersion(remote, known)
      delete choices[remote.id]
    }
    try {
      const params = new URLSearchParams({ maxResults: '10', showDeleted: 'true', singleEvents: 'false' })
      if (connection.sync_token) params.set('syncToken', connection.sync_token)
      else if (!connection.full_reset) params.set('timeMin', connection.initial_from)
      if (connection.page_token) params.set('pageToken', connection.page_token)
      let page: { items?: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string }
      try { page = await googleRequest(token, `${base}?${params}`) }
      catch (cause) {
        if (!(cause instanceof GoogleApiError && cause.status === 410)) throw cause
        // Keep local data and identity mappings; never erase user events to reset a sync token.
        const { error } = await client.from('google_calendar_connections').update({ sync_token: null, page_token: null, full_reset: true, last_error: null })
          .eq('user_id', userId).eq('lease_id', lease)
        if (error) throw error
        return { pulled: 0, pushed: 0, conflicts: [], more: true, message: 'Token Google scaduto. Premi Continua per rileggere il calendario senza cancellare dati.' }
      }
      if (!page.nextPageToken && !page.nextSyncToken) throw new Error('Google non ha restituito il token di sincronizzazione. Riprova.')
      for (const remote of page.items || []) {
        if (Date.now() - startedAt > 40000) { unfinished = true; break }
        try { await reconcile(remote) }
        catch (cause) { if (cause instanceof ConflictError) conflicts.push(cause.conflict); else throw cause }
      }
      const { data: changes, error } = await client.from('google_calendar_outbox').select('event_id,version').eq('user_id', userId).order('changed_at').order('event_id').limit(10)
      if (error) throw error
      for (const change of changes || []) {
        if (Date.now() - startedAt > 40000) { unfinished = true; break }
        try {
          const { data: link, error } = await client.from('google_calendar_links').select('*').eq('user_id', userId).eq('calendar_id', calendarId).eq('original_event_id', change.event_id).maybeSingle()
          if (error) throw error
          const current = await local(change.event_id)
          if (link) {
            let remote: GoogleEvent
            try { remote = await googleRequest(token, `${base}/${encodeURIComponent(link.google_event_id)}`) }
            catch (cause) {
              if (!(cause instanceof GoogleApiError && [404, 410].includes(cause.status))) throw cause
              remote = { id: link.google_event_id, etag: link.google_etag, status: 'cancelled' }
            }
            await reconcile(remote, link)
          } else if (current && !current.is_completed) {
            await writeGoogle(current)
          }
          const { error: removeError } = await client.from('google_calendar_outbox').delete().eq('user_id', userId).eq('event_id', change.event_id).eq('version', change.version)
          if (removeError) throw removeError
        } catch (cause) {
          if (cause instanceof ConflictError) { if (!conflicts.some(item => item.id === cause.conflict.id)) conflicts.push(cause.conflict) }
          else throw cause
        }
      }
      const { count, error: countError } = await client.from('google_calendar_outbox').select('event_id', { count: 'exact', head: true }).eq('user_id', userId)
      if (countError) throw countError
      const updates = conflicts.length ? { last_error: `${conflicts.length} conflitti da risolvere nelle impostazioni calendario.` } : unfinished ? {
        last_sync_at: new Date().toISOString(), last_error: null,
      } : {
        page_token: page.nextPageToken || null, sync_token: page.nextSyncToken || connection.sync_token,
        full_reset: page.nextSyncToken ? false : connection.full_reset,
        last_sync_at: new Date().toISOString(), last_error: null,
      }
      const { error: saveError } = await client.from('google_calendar_connections').update(updates).eq('user_id', userId).eq('lease_id', lease)
      if (saveError) throw saveError
      return { pulled, pushed, conflicts, more: !conflicts.length && (Boolean(page.nextPageToken) || Boolean(count) || unfinished), message: conflicts.length ? 'Scegli la versione da mantenere per continuare.' : 'Lotto sincronizzato.' }
    } catch (cause) {
      const { error } = await client.from('google_calendar_connections').update({ last_error: cause instanceof Error ? cause.message : 'Sincronizzazione non riuscita.' }).eq('user_id', userId).eq('lease_id', lease)
      if (error) throw error
      throw cause
    }
  })
}
