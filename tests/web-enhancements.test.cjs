const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const crypto = require('node:crypto')
const root = path.resolve(__dirname, '..')
function load(relative, overrides = {}) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  })
  const module = { exports: {} }
  vm.runInThisContext(`(function(require,module,exports){${outputText}\n})`, { filename: relative })(
    name => Object.hasOwn(overrides, name) ? overrides[name] : require(name), module, module.exports,
  )
  return module.exports
}
function hookHarness(runEffects = false) {
  const slots = []
  let cursor = 0, effects = [], dirty = false
  const react = {
    useState(initial) {
      const index = cursor++
      if (!Object.hasOwn(slots, index)) slots[index] = initial
      return [slots[index], value => {
        const next = typeof value === 'function' ? value(slots[index]) : value
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true }
      }]
    },
    useRef(initial) {
      const index = cursor++
      if (!Object.hasOwn(slots, index)) slots[index] = { current: initial }
      return slots[index]
    },
    useEffect(callback, dependencies) {
      const index = cursor++
      const previous = slots[index]
      if (!previous || dependencies.some((value, offset) => !Object.is(value, previous[offset]))) {
        slots[index] = dependencies
        if (runEffects) effects.push(callback)
      }
    },
    useCallback: callback => callback,
  }
  return { react, render(component) {
    let result, renders = 0
    do {
      dirty = false; cursor = 0; effects = []
      result = component()
      effects.forEach(callback => callback())
      if (++renders > 10) throw new Error('Unexpected hook render loop')
    } while (dirty)
    return result
  } }
}
function elements(node, type) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, type))
  if (!node || typeof node !== 'object') return []
  return [...(node.type === type ? [node] : []), ...elements(node.props?.children, type)]
}
const lifecycle = load('lib/lifecycle.ts')
const google = load('lib/googleCalendar.ts')
const event = (changes = {}) => ({
  id: '00000000-0000-4000-8000-000000000001', title: 'Test', description: 'Test notes', location: 'Roma',
  start_date: '2026-03-28T09:00:00.000Z', end_date: '2026-03-28T10:00:00.000Z',
  all_day: false, is_recurring: false, recurring_type: null, is_completed: false, ...changes,
})
test('history pages contain exactly five visible entries', () => assert.equal(lifecycle.HISTORY_PAGE_SIZE, 5))
test('event confirmation worker supports web-only, native-only and mixed devices and retries APNs failures', async () => {
  const envNames = ['WEB_PUSH_SUBJECT', 'WEB_PUSH_PUBLIC_KEY', 'WEB_PUSH_PRIVATE_KEY']
  const previous = envNames.map(name => process.env[name])
  envNames.forEach(name => { process.env[name] = 'fixture' })
  try {
    for (const scenario of [
      { web: true, native: false, failed: false, delivered: 1 },
      { web: false, native: true, failed: false, delivered: 1 },
      { web: true, native: true, failed: false, delivered: 1 },
      { web: false, native: false, failed: false, delivered: 0 },
      { web: true, native: true, failed: true, delivered: 0 },
    ]) {
      const mutations = []
      const nativeRequests = []
      let webRequests = 0
      const client = {
        rpc: async () => ({ data: [{ queue_id: 'q', event_id: 'event', user_id: 'owner', lease_id: 'lease', title: 'Test' }] }),
        from(table) {
          const builder = {
            select: () => builder, eq: () => builder, limit: () => builder,
            maybeSingle: async () => ({ data: { is_completed: false } }),
            update(value) { mutations.push(value); return builder },
            then(resolve) {
              const data = table === 'web_push_subscriptions' ? (scenario.web ? [{ id: 'web', endpoint: 'https://web.push.apple.com/fixture', p256dh: 'key', auth: 'auth' }] : []) :
                table === 'push_devices' ? (scenario.native ? [{ id: 'native' }] : []) : null
              return Promise.resolve({ data }).then(resolve)
            },
          }
          return builder
        },
        functions: { invoke: async (name, input) => {
          nativeRequests.push({ name, input })
          return { data: { sent: scenario.failed ? 0 : 1, failed: scenario.failed ? 1 : 0 } }
        } },
      }
      const route = load('app/api/web-push/send/route.ts', {
        'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
        '@/lib/serverAuth': { serverClient: () => client, validCronAuthorization: () => true },
        'web-push': { default: { sendNotification: async () => { webRequests++ }, WebPushError: class extends Error {} } },
      })
      const response = await route.POST(new Request('https://aksuite.app/api/web-push/send', { method: 'POST' }))
      assert.equal(response.body.delivered, scenario.delivered)
      assert.equal(response.status, scenario.failed ? 502 : 200)
      assert.equal(webRequests, scenario.web ? 1 : 0)
      assert.equal(nativeRequests.length, scenario.native ? 1 : 0)
      if (scenario.native) {
        assert.equal(nativeRequests[0].name, 'send-push')
        assert.equal(nativeRequests[0].input.body.data.category, 'EVENT_CONFIRMATION')
        assert.equal(nativeRequests[0].input.body.data.destination, 'calendar-confirmation')
      }
      assert.equal(mutations.some(value => value.sent_at), !scenario.failed)
    }
  } finally {
    envNames.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name]
      else process.env[name] = previous[index]
    })
  }
})
test('web APIs, PWA launches and notification/OAuth responses stay on origin for Apple browser agents', () => {
  const { middleware } = load('middleware.ts', { 'next/server': { NextResponse: { next: () => 'next', redirect: () => 'redirect' } } })
  const request = (path, agent) => ({ headers: new Headers({ 'user-agent': agent }), nextUrl: { clone: () => new URL(`https://aksuite.app${path}`) }, url: `https://aksuite.app${path}` })
  for (const agent of ['iPhone', 'iPad']) {
    for (const path of ['/api/web-push/config','/api/google-calendar/callback','/sw.js','/manifest.webmanifest','/aksuite-icon.png','/?web=1','/?event-response=fixture','/?google-calendar=connected']) {
      assert.equal(middleware(request(path, agent)), 'next', `${agent} ${path}`)
    }
    assert.equal(middleware(request('/', agent)), 'redirect')
  }
  assert.equal(middleware(request('/', 'Macintosh')), 'next')
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8')).start_url, '/?web=1')
})
test('event save/reschedule validation rejects invalid dates, missing titles and inverted times', () => {
  assert.equal(lifecycle.validateEventTiming(event()).end.toISOString(), event().end_date)
  assert.throws(() => lifecycle.validateEventTiming(event({ title: ' ' })))
  assert.throws(() => lifecycle.validateEventTiming(event({ start_date: '2026-02-30T10:00:00Z' })))
  assert.throws(() => lifecycle.validateEventTiming(event({ end_date: event().start_date })))
  assert.throws(() => lifecycle.validateEventTiming(event({ end_date: '2026-03-27T10:00:00Z' })))
  assert.ok(lifecycle.validateEventTiming(event({ all_day: true, start_date: '2026-03-28', end_date: '2026-03-28' })))
})
test('history date ranges use inclusive local day boundaries and reject reversed ranges', () => {
  const dates = lifecycle.historyDates('2026-03-28', '2026-03-29')
  assert.equal(new Date(dates.start).getHours(), 0)
  assert.equal(new Date(dates.end).getHours(), 23)
  assert.equal(new Date(dates.end).getMilliseconds(), 999)
  assert.deepEqual(lifecycle.historyDates('', ''), { start: undefined, end: undefined })
  assert.throws(() => lifecycle.historyDates('2026-04-01', '2026-03-01'))
  assert.throws(() => lifecycle.historyDates('invalid', ''))
})
test('whole-day event deadlines and date input handle both Rome DST transitions', () => {
  assert.equal(lifecycle.romeDateStart('2026-03-29'), '2026-03-28T23:00:00.000Z')
  assert.equal(lifecycle.romeDateStart('2026-03-30'), '2026-03-29T22:00:00.000Z')
  assert.equal(lifecycle.romeDateStart('2026-10-25'), '2026-10-24T22:00:00.000Z')
  assert.equal(lifecycle.romeDateStart('2026-10-26'), '2026-10-25T23:00:00.000Z')
  assert.throws(() => lifecycle.romeDateStart('2026-02-30'))
  assert.equal(lifecycle.eventExpiry(event({ all_day: true, start_date: '2026-03-29T12:00Z', end_date: null })), Date.parse('2026-03-29T22:00Z'))
  assert.equal(lifecycle.eventExpiry(event()), Date.parse(event().end_date))
})
test('Google conversions preserve timed events, completion and absent end dates', () => {
  for (const item of [event(), event({ is_completed: true }), event({ end_date: null })]) {
    const payload = { ...google.toGoogleEvent(item, 'owner'), id: 'google', etag: 'v1' }
    const { id, ...expected } = item
    assert.deepEqual(google.fromGoogleEvent(payload, 'owner'), expected)
  }
})
test('Google all-day exclusive ends round trip inclusive AK Suite dates across DST', () => {
  const item = event({ all_day: true, start_date: '2026-03-28T23:00:00.000Z', end_date: '2026-03-29T22:00:00.000Z' })
  const payload = { ...google.toGoogleEvent(item, 'owner'), id: 'google', etag: 'v1' }
  assert.deepEqual(payload.start, { date: '2026-03-29' })
  assert.deepEqual(payload.end, { date: '2026-03-31' })
  const { id, ...expected } = item
  assert.deepEqual(google.fromGoogleEvent(payload, 'owner'), expected)
})
test('external calendar metadata cannot mark another user event completed', () => {
  const payload = { ...google.toGoogleEvent(event({ is_completed: true }), 'outsider'), id: 'google', etag: 'v1' }
  assert.equal(google.fromGoogleEvent(payload, 'owner').is_completed, false)
})
test('complex Google recurrence rules are preserved, but explicit frequency changes are applied', () => {
  const rules = ['RRULE:FREQ=WEEKLY;BYDAY=MO,WE', 'EXDATE;TZID=Europe/Rome:20261207T100000']
  assert.deepEqual(google.toGoogleEvent(event({ is_recurring: true, recurring_type: 'weekly' }), 'owner', rules).recurrence, rules)
  assert.deepEqual(google.toGoogleEvent(event({ is_recurring: true, recurring_type: 'monthly' }), 'owner', rules).recurrence, ['RRULE:FREQ=MONTHLY'])
  assert.deepEqual(google.toGoogleEvent(event(), 'owner', rules).recurrence, [])
  assert.equal(google.toGoogleEvent(event({ is_recurring: true, recurring_type: 'weekly' }), 'owner', rules, 'America/New_York').start.timeZone, 'America/New_York')
})
test('import identities are deterministic and isolated by user/calendar', () => {
  const id = google.importedEventId('owner', 'calendar', 'google')
  assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/)
  assert.equal(id, google.importedEventId('owner', 'calendar', 'google'))
  assert.notEqual(id, google.importedEventId('outsider', 'calendar', 'google'))
  assert.notEqual(id, google.importedEventId('owner', 'other', 'google'))
})
test('OAuth credentials are encrypted with authenticated encryption and reject tampering', () => {
  const previous = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64')
  try {
    const value = { access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_at: Date.now() + 3600000 }
    const encrypted = google.encryptGoogleCredentials(value)
    assert.ok(!encrypted.includes('fixture'))
    assert.deepEqual(google.decryptGoogleCredentials(encrypted), value)
    const tampered = Buffer.from(encrypted, 'base64')
    tampered[tampered.length - 1] ^= 1
    assert.throws(() => google.decryptGoogleCredentials(tampered.toString('base64')))
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64')
    assert.throws(() => google.decryptGoogleCredentials(encrypted))
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
    else process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = previous
  }
})
test('calendar revision hashes ignore display timestamps but track semantic changes', () => {
  const item = event()
  assert.equal(google.localEventHash(item), google.localEventHash({ ...item, updated_at: '2030-01-01' }))
  assert.notEqual(google.localEventHash(item), google.localEventHash({ ...item, is_completed: true }))
  assert.notEqual(google.localEventHash(item), google.localEventHash({ ...item, title: 'Changed' }))
})
test('service worker push actions open authenticated confirmation URLs without direct mutations', async () => {
  const handlers = {}
  let shown
  let opened
  const self = {
    addEventListener: (name, callback) => { handlers[name] = callback },
    location: { origin: 'https://aksuite.app' },
    registration: { showNotification: async (title, options) => { shown = { title, options } } },
    clients: { openWindow: async url => { opened = url } },
  }
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8'), { self, URL, console })
  let pending
  handlers.push({ data: { json: () => ({ title: 'Done?', url: '/?event-response=fixture', actions: [{ action: 'complete', title: 'Yes' }] }) }, waitUntil: promise => { pending = promise } })
  await pending
  assert.equal(shown.title, 'Done?')
  assert.equal(shown.options.actions[0].action, 'complete')
  handlers.notificationclick({ notification: { close() {}, data: '/?event-response=fixture' }, action: 'reschedule', waitUntil: promise => { pending = promise } })
  await pending
  assert.equal(opened, 'https://aksuite.app/?event-response=fixture&event-action=reschedule')
  opened = null
  handlers.notificationclick({ notification: { close() {}, data: 'https://evil.example/' }, waitUntil() {} })
  assert.equal(opened, null)
})
test('history and photo galleries never fetch database records while initially rendering', () => {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  let requests = 0
  const overrides = {
    '@/lib/supabase': { supabase: { from() { requests++; throw new Error('Unexpected eager query') } } },
    '@/lib/lifecycle': lifecycle,
    '../hooks/useAuth': { useAuth: () => ({ user: { id: 'owner' } }) },
  }
  const History = load('platforms/Desktop/app/components/HistoryBrowser.tsx', overrides).default
  const Gallery = load('platforms/Desktop/app/components/PhotoGallery.tsx', overrides).default
  const historyHtml = renderToStaticMarkup(React.createElement(History, { kind: 'todo', state: 'archived', onOpen() {} }))
  const galleryHtml = renderToStaticMarkup(React.createElement(Gallery, { scope: { general: true } }))
  assert.ok(historyHtml.includes('Cerca / carica 5'))
  assert.ok(historyHtml.includes('Eseguite dal'))
  assert.ok(galleryHtml.includes('Carica foto'))
  assert.ok(galleryHtml.includes('Aggiungi foto'))
  assert.equal(requests, 0)
})
test('calendar completion actions expose both completion and user-chosen rescheduling', () => {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const Actions = load('platforms/Desktop/app/components/EventCompletionActions.tsx', { '@/lib/supabase': { supabase: {} } }).default
  const html = renderToStaticMarkup(React.createElement(Actions, { event: event(), onDone() {}, onReschedule() {} }))
  assert.ok(html.includes('Sì, completato'))
  assert.ok(html.includes('type="button"'))
  assert.ok(html.includes('scegli nuova data e ora'))
  const completed = renderToStaticMarkup(React.createElement(Actions, { event: event({ is_completed: true }), onDone() {} }))
  assert.ok(completed.includes('Riporta da fare'))
})
test('dashboard photo card opens the gallery and does not invent an unloaded photo count', () => {
  const source = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(root, 'platforms/Desktop/app/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let itemsNode, clickNode
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'items') itemsNode = node.initializer
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === 'button') {
      const attributes = node.attributes.properties
      const card = attributes.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'className')
      if (card?.initializer && ts.isStringLiteral(card.initializer) && card.initializer.text === 'ak-bento group text-left') {
        clickNode = attributes.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'onClick')?.initializer?.expression
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(itemsNode && clickNode)
  const context = {
    module: { exports: null }, todayCount: 0, openCalls: [], events: [], notes: [], passwords: [], clients: [],
    openWorkItems: [], openTodos: [], shopping: { items: [] }, unpaidPayments: [], isAdmin: false,
    isPendingEvent: () => true,
  }
  for (const icon of ['CheckCircle2', 'Phone', 'Calendar', 'StickyNote', 'LayoutGrid', 'KeyRound', 'Users', 'Briefcase', 'ClipboardList', 'ShoppingCart', 'CreditCard', 'Shield']) context[icon] = () => null
  const compiled = ts.transpileModule(`module.exports = ${itemsNode.getText(source)}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText
  vm.runInNewContext(compiled, context)
  assert.equal(context.module.exports[0][0], 'today')
  assert.equal(context.module.exports.find(item => item[0] === 'photos')[3], null)
  const calls = []
  const click = vm.runInNewContext(`(${clickNode.getText(source)})`, {
    id: 'photos', navigateToSection: id => calls.push(['navigate', id]),
    setSection: id => calls.push(['section', id]), open: id => calls.push(['modal', id]), close: () => calls.push(['close']),
  })
  click()
  assert.deepEqual(calls, [['navigate', 'photos']])
})
test('calendar and global search use distinct account-scoped React keys', () => {
  const source = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(root, 'platforms/Desktop/app/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const expressions = []
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && ['CalendarView', 'GlobalSearchModal'].includes(node.tagName.getText(source))) {
      const key = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'key')
      assert.ok(key?.initializer?.expression)
      expressions.push(key.initializer.expression.getText(source))
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(expressions.length, 2)
  for (const user of [{ id: 'owner' }, { id: 'other-owner' }, null]) {
    const keys = expressions.map(expression => vm.runInNewContext(expression, { user }))
    assert.notEqual(keys[0], keys[1])
    for (const key of keys) assert.ok(key.includes(user?.id || 'guest'))
  }
})
test('history prunes changed records, rejects stale in-flight results and reloads only on user request', async () => {
  const harness = hookHarness(true)
  const item = event({ is_completed: true, completed_at: '2026-10-05T13:00:00Z' })
  let requests = 0, deferred = false, finishRead
  const query = {}
  for (const name of ['select', 'eq', 'is', 'not', 'ilike', 'order']) query[name] = () => query
  query.limit = limit => {
    assert.equal(limit, 6)
    requests++
    const result = { data: [item], error: null }
    return deferred ? new Promise(resolve => { finishRead = () => resolve(result) }) : Promise.resolve(result)
  }
  const jsx = (type, props, key) => ({ type, props, key })
  const History = load('platforms/Desktop/app/components/HistoryBrowser.tsx', {
    react: harness.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/lib/supabase': { supabase: { from: () => query } }, '@/lib/lifecycle': lifecycle,
    '../hooks/useAuth': { useAuth: () => ({ user: { id: 'owner' } }) },
  }).default
  let props = { kind: 'event', state: 'completed', onOpen() {} }
  const render = () => harness.render(() => History(props))
  const records = tree => elements(tree, 'button').filter(button => button.key === item.id)
  const submit = tree => elements(tree, 'form')[0].props.onSubmit({ preventDefault() {} })
  let tree = render()
  assert.equal(requests, 0)
  elements(tree, 'input')[0].props.onChange({ target: { value: 'fixture title' } })
  submit(render())
  await Promise.resolve()
  assert.equal(records(render()).length, 1)
  props = { ...props, changedItem: { id: item.id } }
  tree = render()
  assert.equal(records(tree).length, 0)
  assert.equal(elements(tree, 'input')[0].props.value, 'fixture title')
  assert.equal(requests, 1)
  deferred = true
  submit(tree)
  props = { ...props, changedItem: { id: item.id } }
  render()
  finishRead()
  await Promise.resolve()
  assert.equal(records(render()).length, 0)
  deferred = false
  submit(render())
  await Promise.resolve()
  assert.equal(records(render()).length, 1)
  assert.equal(requests, 3)
})
test('event and work hooks hide previous-account data and reject late writes after an account change', async () => {
  for (const [filename, exportName, addName, field] of [
    ['useEvents', 'useEvents', 'addEvent', 'events'],
    ['useWorkItems', 'useWorkItems', 'addWorkItem', 'workItems'],
  ]) {
    const harness = hookHarness()
    let user = { id: 'owner' }, deferred = false, finishWrite, inserted
    const query = {
      insert(value) { inserted = Array.isArray(value) ? value[0] : value; return query },
      select() { return query },
      single() {
        const response = { data: { ...inserted, id: 'saved-record' }, error: null }
        return deferred ? new Promise(resolve => { finishWrite = () => resolve(response) }) : Promise.resolve(response)
      },
    }
    const hook = load(`platforms/Desktop/app/hooks/${filename}.ts`, {
      react: harness.react, './useAuth': { useAuth: () => ({ user }) }, '@/lib/supabase': { supabase: { from: () => query } },
    })[exportName]
    const render = () => harness.render(hook)
    const input = { ...event(), kind: 'todo', status: 'planned', materials: [], checklist: [] }
    await render()[addName](input)
    assert.equal(render()[field].length, 1, filename)
    deferred = true
    const pending = render()[addName](input)
    user = { id: 'different-owner' }
    assert.equal(render()[field].length, 0, filename)
    finishWrite()
    await assert.rejects(pending, /Sessione cambiata/)
    assert.equal(render()[field].length, 0, filename)
  }
})
