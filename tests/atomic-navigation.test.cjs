const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
function elements(node, type) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, type))
  if (!node || typeof node !== 'object') return []
  return [...(node.type === type ? [node] : []), ...elements(node.props?.children, type)]
}

function harness(reduced = false) {
  const slots = []
  const timers = new Map()
  let cursor = 0, effects = [], nextTimer = 0, time = 0, tree, props
  const body = { style: { overflow: 'auto' } }
  const dialog = { open: false, showModal() { this.open = true }, close() { this.open = false } }
  const navigated = []
  const react = {
    useState(initial) {
      const i = cursor++
      if (!slots[i]) slots[i] = { value: initial }
      return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value }]
    },
    useRef(initial) {
      const i = cursor++
      if (!slots[i]) slots[i] = { current: initial }
      return slots[i]
    },
    useEffect(callback, dependencies) {
      const i = cursor++
      const old = slots[i]
      if (!old || dependencies.some((value, index) => !Object.is(value, old.dependencies[index]))) {
        effects.push(() => {
          old?.cleanup?.()
          slots[i] = { dependencies, cleanup: callback() }
        })
      }
    },
  }
  const source = fs.readFileSync(path.join(root, 'platforms/Desktop/app/components/WebOrbitNavigation.tsx'), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  })
  const module = { exports: {} }
  const context = {
    module, exports: module.exports,
    document: { body },
    window: {
      matchMedia: () => ({ matches: reduced }),
      setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { at: time + delay, callback }); return id },
      clearTimeout(id) { timers.delete(id) },
    },
    require(name) {
      if (name === 'react') return react
      if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
      if (name === './webSectionColors') return { webSectionStyle: () => ({}) }
      return require(name)
    },
  }
  vm.runInNewContext(outputText, context)
  const Icon = () => null
  props = {
    open: true, section: 'today',
    items: ['today', 'calls', 'calendar', 'todos', 'work_items', 'clients', 'notes', 'payments', 'passwords', 'shopping', 'photos']
      .map(id => [id, id, Icon]),
    onNavigate: id => navigated.push(id),
    onClose: () => { props.open = false },
  }
  function render() {
    cursor = 0; effects = []
    tree = module.exports.default(props)
    tree.ref.current = dialog
    effects.forEach(callback => callback())
    cursor = 0; effects = []
    tree = module.exports.default(props)
    return tree
  }
  function advance(ms) {
    const end = time + ms
    while (true) {
      const next = [...timers.entries()].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      time = next[1].at; timers.delete(next[0]); next[1].callback(); render()
    }
    time = end
  }
  function click(label) {
    const button = elements(tree, 'button').find(node => node.props.children === label ||
      elements(node.props.children, 'span').some(span => span.props.children === label))
    assert.ok(button, `Missing button: ${label}`)
    button.props.onClick(); render()
  }
  render()
  return { render, advance, click, props, dialog, body, navigated,
    get tree() { return tree },
    groups() { return elements(tree, 'button').filter(node => node.props['aria-expanded'] !== undefined) },
  }
}

test('atomic categories stay open together, can collapse independently and never expose admin-only items', () => {
  const h = harness()
  for (const title of ['Operatività', 'Gestione', 'Strumenti']) h.click(title)
  assert.ok(h.groups().every(node => node.props['aria-expanded']))
  h.click('Gestione')
  assert.deepEqual(h.groups().map(node => node.props['aria-expanded']), [true, false, true])
  assert.ok(!elements(h.tree, 'button').some(node => elements(node.props.children, 'span').some(span => span.props.children === 'users')))
})

test('navigation waits for every branch, satellites and core to close and restores scrolling', () => {
  const h = harness()
  for (const title of ['Operatività', 'Gestione', 'Strumenti']) h.click(title)
  h.click('calendar')
  assert.equal(h.dialog.open, true)
  assert.equal(h.body.style.overflow, 'hidden')
  h.advance(1500)
  assert.deepEqual(h.navigated, [])
  assert.equal(h.tree.props['data-phase'], 'atom')
  h.advance(420)
  assert.equal(h.tree.props['data-phase'], 'core')
  h.advance(200)
  assert.deepEqual(h.navigated, ['calendar'])
  assert.equal(h.dialog.open, false)
  assert.equal(h.body.style.overflow, 'auto')
})

test('reopening cancels pending closure and navigation', () => {
  const h = harness()
  h.click('Operatività')
  h.click('calls')
  h.advance(100)
  h.props.open = true; h.render()
  h.advance(3000)
  assert.equal(h.dialog.open, true)
  assert.deepEqual(h.navigated, [])
  assert.equal(h.body.style.overflow, 'hidden')
})

test('reduced motion closes immediately without waiting for animation timers', () => {
  const h = harness(true)
  h.click('Operatività')
  h.click('calls')
  assert.equal(h.dialog.open, false)
  assert.deepEqual(h.navigated, ['calls'])
  assert.equal(h.body.style.overflow, 'auto')
})
