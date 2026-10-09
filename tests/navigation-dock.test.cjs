const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../platforms/Desktop/app/components/WebNavigationDock.tsx'), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
})
const moduleUnderTest = { exports: {} }
vm.runInNewContext(outputText, {
  module: moduleUnderTest, exports: moduleUnderTest.exports,
  require(name) {
    if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
    if (name === './webSectionColors') return { webSectionStyle: id => ({ '--section-accent': id }) }
    return require(name)
  },
})
function buttons(node) {
  if (Array.isArray(node)) return node.flatMap(buttons)
  if (!node || typeof node !== 'object') return []
  return [...(node.type === 'button' ? [node] : []), ...buttons(node.props?.children)]
}

test('dock exposes four labeled shortcuts around the launcher and uses shared navigation', () => {
  const navigated = []
  let opened = 0
  const Icon = () => null
  const tree = moduleUnderTest.exports.default({
    menuOpen: false, section: 'calendar',
    items: [['today', 'Dashboard'], ['calendar', 'Calendario'], ['calls', 'Chiamate'], ['todos', 'Cose da fare']]
      .map(([id, title]) => [id, title, Icon]),
    onNavigate: id => navigated.push(id),
    onOpen: () => opened++,
  })
  const controls = buttons(tree)
  assert.deepEqual(controls.map(button => button.props['aria-label']),
    ['Dashboard', 'Calendario', 'Apri menu principale', 'Chiamate', 'Cose da fare'])
  assert.equal(controls[1].props['aria-current'], 'page')
  assert.equal(controls[0].props['aria-current'], undefined)
  controls.forEach(button => button.props.onClick())
  assert.deepEqual(navigated, ['today', 'calendar', 'calls', 'todos'])
  assert.equal(opened, 1)
  assert.equal(controls[2].props['aria-haspopup'], 'dialog')
})

test('dock reflects the open menu without adding unavailable destinations', () => {
  const tree = moduleUnderTest.exports.default({
    menuOpen: true, section: 'today', items: [],
    onNavigate: () => assert.fail('Unexpected navigation'), onOpen: () => {},
  })
  assert.equal(tree.props['data-menu-open'], true)
  assert.equal(buttons(tree).length, 1)
  assert.equal(buttons(tree)[0].props['aria-expanded'], true)
})
