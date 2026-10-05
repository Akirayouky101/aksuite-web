const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const crypto = require('node:crypto')

function load(file, overrides = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(
    name => Object.hasOwn(overrides, name) ? overrides[name] : require(name), module, module.exports,
  )
  return module.exports
}
const google = load('lib/googleCalendar.ts')
const owner = '00000000-0000-4000-8000-000000000001'
const localEvent = () => ({
  id: '00000000-0000-4000-8000-000000000002', user_id: owner, title: 'Local appointment',
  description: '', location: '', start_date: '2026-10-10T09:00:00.000Z', end_date: '2026-10-10T10:00:00.000Z',
  all_day: false, is_recurring: false, recurring_type: null, is_completed: false, updated_at: '2026-10-05T10:00:00Z',
})

function fixture() {
  const tables = {
    google_calendar_connections: [{ user_id: owner, calendar_id: 'calendar', initial_from: '2026-01-01T00:00:00Z', sync_token: null, page_token: null, full_reset: false }],
    events: [], google_calendar_links: [], google_calendar_outbox: [],
  }
  const remote = new Map()
  let failStatus = null
  let patchStatus = null
  let pageToken = null
  let revision = 0
  const requests = []
  function outbox(item) {
    const prior = tables.google_calendar_outbox.find(row => row.event_id === item.id)
    const next = { user_id: owner, event_id: item.id, version: crypto.randomUUID(), changed_at: new Date().toISOString() }
    if (prior) Object.assign(prior, next)
    else tables.google_calendar_outbox.push(next)
  }
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.action = 'select' }
    select(_columns, options) { this.options = options; return this }
    eq(key, value) { this.filters.push(row => row[key] === value); return this }
    order() { return this }
    limit(size) { this.size = size; return this }
    update(value) { this.action = 'update'; this.value = value; return this }
    insert(value) { this.action = 'insert'; this.value = value; return this }
    upsert(value, options) { this.action = 'upsert'; this.value = value; this.upsertOptions = options; return this }
    delete() { this.action = 'delete'; return this }
    single() { this.one = true; return this }
    maybeSingle() { this.one = true; return this }
    then(resolve, reject) {
      try {
        let rows = tables[this.table].filter(row => this.filters.every(filter => filter(row)))
        if (this.size) rows = rows.slice(0, this.size)
        if (this.action === 'update') for (const row of rows) {
          Object.assign(row, this.value)
          if (this.table === 'events') outbox(row)
        }
        if (this.action === 'delete') {
          for (const row of rows) {
            tables[this.table].splice(tables[this.table].indexOf(row), 1)
            if (this.table === 'events') {
              for (const link of tables.google_calendar_links) if (link.local_event_id === row.id) link.local_event_id = null
              outbox(row)
            }
          }
        }
        if (this.action === 'insert' || this.action === 'upsert') {
          const value = { updated_at: new Date().toISOString(), ...this.value }
          const prior = this.action === 'upsert' && tables[this.table].find(row =>
            row.user_id === value.user_id && (this.table === 'google_calendar_outbox' ? row.event_id === value.event_id : row.calendar_id === value.calendar_id && row.google_event_id === value.google_event_id))
          if (prior) { if (!this.upsertOptions?.ignoreDuplicates) Object.assign(prior, value) }
          else tables[this.table].push(value)
          rows = [prior || value]
          if (this.table === 'events') outbox(value)
        }
        return Promise.resolve({ data: this.options?.head ? null : this.one ? structuredClone(rows[0] || null) : structuredClone(rows), count: rows.length, error: null }).then(resolve, reject)
      } catch (cause) { return Promise.reject(cause).then(resolve, reject) }
    }
  }
  const client = {
    from: table => new Query(table),
    rpc: async () => {
      const connection = tables.google_calendar_connections[0]
      if (connection.lease_id) return { data: null, error: null }
      connection.lease_id = 'lease'
      return { data: 'lease', error: null }
    },
  }
  const request = async (_access, path, options = {}) => {
    requests.push({ path, options })
    if (failStatus) { const status = failStatus; failStatus = null; throw new google.GoogleApiError(status) }
    const method = options.method || 'GET'
    if (path.includes('?')) return { items: structuredClone([...remote.values()]), ...(pageToken ? { nextPageToken: pageToken } : { nextSyncToken: 'new-sync-token' }) }
    if (method === 'POST') {
      const payload = JSON.parse(options.body)
      const value = { ...payload, id: payload.id || `generated${++revision}`, etag: `v${++revision}` }
      if (remote.has(value.id)) throw new google.GoogleApiError(409)
      remote.set(value.id, value)
      return structuredClone(value)
    }
    const id = decodeURIComponent(path.split('/').pop())
    const previous = remote.get(id)
    if (!previous) throw new google.GoogleApiError(404)
    if (method === 'PATCH') {
      if (patchStatus) throw new google.GoogleApiError(patchStatus)
      if (options.headers['If-Match'] !== previous.etag) throw new google.GoogleApiError(412)
      const value = { ...previous, ...JSON.parse(options.body), etag: `v${++revision}` }
      remote.set(id, value)
      return structuredClone(value)
    }
    if (method === 'DELETE') { remote.delete(id); return undefined }
    return structuredClone(previous)
  }
  const { syncGoogleCalendar } = load('lib/googleCalendarSync.ts', {
    './googleCalendar': { ...google, googleRequest: request, googleAccessToken: async () => 'fixture-token' },
  })
  return {
    tables, remote, requests, outbox, sync: resolutions => syncGoogleCalendar(client, owner, resolutions),
    fail: status => { failStatus = status }, failPatch: status => { patchStatus = status }, paginate: token => { pageToken = token },
  }
}

test('Google sync imports and exports without duplicate creation on repeated runs', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  f.remote.set('external', { id: 'external', etag: 'external-v1', summary: 'Google appointment', start: { dateTime: '2026-10-11T09:00:00Z' }, end: { dateTime: '2026-10-11T10:00:00Z' } })
  const first = await f.sync()
  assert.equal(first.pulled, 1)
  assert.equal(first.pushed, 1)
  assert.equal(f.tables.events.length, 2)
  assert.equal(f.remote.size, 2)
  await f.sync()
  assert.equal(f.tables.events.length, 2)
  assert.equal(f.remote.size, 2)
  assert.equal(f.tables.google_calendar_outbox.length, 0)
})
test('concurrent local/Google edits require an explicit resolution and do not advance the cursor', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  await f.sync()
  const remote = [...f.remote.values()][0]
  remote.summary = 'Google edit'; remote.etag = 'google-new-version'
  item.title = 'Local edit'; item.updated_at = '2026-10-06T10:00:00Z'; f.outbox(item)
  const conflict = await f.sync()
  assert.equal(conflict.conflicts.length, 1)
  assert.equal(item.title, 'Local edit')
  assert.equal(remote.summary, 'Google edit')
  assert.equal(f.tables.google_calendar_connections[0].last_error, '1 conflitti da risolvere nelle impostazioni calendario.')
  const resolved = await f.sync({ [remote.id]: 'google' })
  assert.equal(resolved.conflicts.length, 0)
  assert.equal(item.title, 'Google edit')
  assert.equal(f.tables.google_calendar_outbox.length, 0)
})
test('local deletion uses the stored Google identity instead of recreating the event', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  await f.sync()
  f.tables.events.length = 0
  f.tables.google_calendar_links[0].local_event_id = null
  f.outbox(item)
  await f.sync()
  assert.equal(f.remote.size, 0)
  assert.equal(f.tables.google_calendar_links.length, 0)
  assert.equal(f.tables.google_calendar_outbox.length, 0)
})
test('remote deletion removes unchanged local data and its identity mapping', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  await f.sync()
  const remote = [...f.remote.values()][0]
  remote.status = 'cancelled'; remote.etag = 'deleted-version'
  await f.sync()
  assert.equal(f.tables.events.length, 0)
  assert.equal(f.tables.google_calendar_links.length, 0)
})
test('restoring the local version after a Google deletion uses a stable fresh ID without duplicate recreation', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  await f.sync()
  const previous = [...f.remote.values()][0]
  previous.status = 'cancelled'; previous.etag = 'deleted'
  item.title = 'Keep local'; f.outbox(item)
  const conflict = await f.sync()
  assert.equal(conflict.conflicts.length, 1)
  const restored = await f.sync({ [previous.id]: 'local' })
  assert.equal(restored.conflicts.length, 0)
  const active = [...f.remote.values()].filter(item => item.status !== 'cancelled')
  assert.equal(active.length, 1)
  assert.notEqual(active[0].id, previous.id)
  assert.equal(active[0].summary, 'Keep local')
  await f.sync()
  assert.equal([...f.remote.values()].filter(item => item.status !== 'cancelled').length, 1)
})
test('Google conditional-write failures preserve the unsent local change for retry', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  await f.sync()
  item.title = 'Unsent edit'; f.outbox(item)
  f.failPatch(412)
  const result = await f.sync()
  assert.equal(result.conflicts.length, 1)
  assert.equal(f.tables.google_calendar_outbox.length, 1)
  assert.equal([...f.remote.values()][0].summary, 'Local appointment')
})
test('Google edits without AK Suite private metadata cannot accidentally reopen a completed appointment', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  await f.sync()
  item.is_completed = true; f.outbox(item)
  await f.sync()
  const remote = [...f.remote.values()][0]
  remote.extendedProperties = {}; remote.summary = 'Edited on Google'; remote.etag = 'external-edit'
  await f.sync()
  assert.equal(item.title, 'Edited on Google')
  assert.equal(item.is_completed, true)
})
test('invalid Google sync tokens trigger a full read without erasing local events', async () => {
  const f = fixture()
  const item = localEvent()
  f.tables.events.push(item); f.outbox(item)
  await f.sync()
  f.fail(410)
  const reset = await f.sync()
  assert.equal(reset.more, true)
  assert.equal(f.tables.events.length, 1)
  assert.equal(f.tables.google_calendar_connections[0].full_reset, true)
  assert.equal(f.tables.google_calendar_connections[0].sync_token, null)
  f.requests.length = 0
  await f.sync()
  assert.ok(!f.requests[0].path.includes('timeMin='))
})
test('pagination persists the page cursor and only stores the sync token on the final page', async () => {
  const f = fixture()
  f.paginate('page-two')
  const first = await f.sync()
  assert.equal(first.more, true)
  assert.equal(f.tables.google_calendar_connections[0].page_token, 'page-two')
  assert.equal(f.tables.google_calendar_connections[0].sync_token, null)
  f.paginate(null)
  await f.sync()
  assert.equal(f.tables.google_calendar_connections[0].page_token, null)
  assert.equal(f.tables.google_calendar_connections[0].sync_token, 'new-sync-token')
  assert.ok(f.requests.some(request => request.path.includes('pageToken=page-two')))
})
