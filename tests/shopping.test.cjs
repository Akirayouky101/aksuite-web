const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
function loadTypeScript(relative, overrides = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  })
  const module = { exports: {} }
  const run = vm.runInThisContext(`(function(require, module, exports) { ${outputText}\n})`, { filename: relative })
  run(name => Object.hasOwn(overrides, name) ? overrides[name] : require(name), module, module.exports)
  return module.exports
}
const shopping = loadTypeScript('lib/shopping.ts')
const { createShoppingPdf } = loadTypeScript('platforms/Desktop/app/components/shoppingPdf.ts', {
  '../../../../lib/shopping': shopping,
})
const list = { id: 'list', user_id: 'owner', title: 'Spesa settimanale', created_at: '2026-10-05T12:00:00Z' }
const product = (changes = {}) => ({
  id: 'item', list_id: list.id, name: 'Latte', quantity: '2 confezioni',
  quantity_value: 2, quantity_unit: 'l',
  notes: 'Senza lattosio', purchased: false, created_at: list.created_at, ...changes,
})

test('empty and partially purchased lists have exact progress counts', () => {
  assert.deepEqual(shopping.shoppingProgress([]), { purchased: 0, total: 0, remaining: 0, percent: 0 })
  assert.deepEqual(shopping.shoppingProgress([product(), product({ purchased: true }), product()]), {
    purchased: 1, total: 3, remaining: 2, percent: 33,
  })
  assert.equal(shopping.shoppingProgress([product({ purchased: true })]).percent, 100)
})

test('list title trims input and enforces the exact limits', () => {
  assert.equal(shopping.validateShoppingTitle('  Spesa  '), 'Spesa')
  assert.equal(shopping.validateShoppingTitle('a'.repeat(120)).length, 120)
  for (const invalid of ['', '   ', 'a'.repeat(121)]) assert.throws(() => shopping.validateShoppingTitle(invalid))
})

test('products require a numeric quantity and supported unit', () => {
  assert.deepEqual(shopping.validateShoppingItem({ name: ' Pane ', quantity_value: 500, quantity_unit: 'g', notes: ' Integrale ' }), {
    name: 'Pane', quantity_value: 500, quantity_unit: 'g', notes: 'Integrale',
  })
  for (const unit of shopping.shoppingUnits) {
    assert.equal(shopping.validateShoppingItem({ name: 'Pane', quantity_value: 1.25, quantity_unit: unit, notes: '' }).quantity_unit, unit)
  }
  for (const value of [null, 0, -1, NaN, Infinity, 0.0001, 1.2345, 1.00000001, 1000000000, '2', '2 confezioni']) {
    assert.throws(() => shopping.validateShoppingItem({ name: 'Pane', quantity_value: value, quantity_unit: 'g', notes: '' }))
  }
  assert.throws(() => shopping.validateShoppingItem({ name: ' ', quantity_value: 1, quantity_unit: 'g', notes: '' }))
  assert.throws(() => shopping.validateShoppingItem({ name: 'Pane', quantity_value: 1, quantity_unit: 'confezioni', notes: '' }))
})

test('product field limits are enforced at the boundary', () => {
  const input = { name: 'a'.repeat(160), quantity_value: 999999999, quantity_unit: 'pezzi', notes: 'c'.repeat(1000) }
  assert.deepEqual(shopping.validateShoppingItem(input), input)
  for (const field of ['name', 'notes']) {
    assert.throws(() => shopping.validateShoppingItem({ ...input, [field]: input[field] + 'x' }))
  }
})

test('numeric quantities display consistently and existing text is preserved', () => {
  assert.equal(shopping.shoppingQuantity(product({ quantity_value: 1.25, quantity_unit: 'kg' })), '1,25 kg')
  assert.equal(shopping.shoppingQuantity(product({ quantity_value: 0.001, quantity_unit: 'l' })), '0,001 l')
  assert.equal(shopping.shoppingQuantity(product({ quantity_value: null, quantity_unit: null })), '2 confezioni')
})

test('PDF filenames are safe and have a fallback', () => {
  assert.equal(shopping.shoppingPdfFilename('Caffè / latte'), 'spesa-caffe-latte.pdf')
  assert.equal(shopping.shoppingPdfFilename('🛒'), 'spesa-lista.pdf')
  assert.ok(!shopping.shoppingPdfFilename('../../documento').includes('/'))
  assert.ok(shopping.shoppingPdfFilename('a'.repeat(120)).length <= 80)
})

test('PDF contains the full list, quantities, notes and purchased status', async () => {
  const items = [product({ name: 'Pane', purchased: true }), product({ id: 'other', name: 'Latte' })]
  const before = JSON.stringify(items)
  const blob = createShoppingPdf(list, items)
  assert.equal(blob.type, 'application/pdf')
  const text = Buffer.from(await blob.arrayBuffer()).toString('latin1')
  assert.ok(text.startsWith('%PDF-'))
  for (const value of ['Spesa settimanale', 'Latte', 'Pane', '2 l', 'Senza lattosio', 'Acquistato']) {
    assert.ok(text.includes(value), `Missing PDF content: ${value}`)
  }
  assert.ok(text.indexOf('(Latte)') < text.indexOf('(Pane)'))
  assert.equal(JSON.stringify(items), before, 'Export must not mutate the list')
})

test('PDF handles empty lists and paginates long content without dropping final products', async () => {
  const empty = Buffer.from(await createShoppingPdf(list, []).arrayBuffer()).toString('latin1')
  assert.ok(empty.includes('Nessun prodotto nella lista.'))
  const items = Array.from({ length: 80 }, (_, i) => product({
    id: String(i), name: `Prodotto ${i}`, notes: `${'Nota lunga con dettagli. '.repeat(35)}Fine nota ${i}`,
  }))
  const text = Buffer.from(await createShoppingPdf(list, items).arrayBuffer()).toString('latin1')
  const pages = [...text.matchAll(/\/Type \/Page\b/g)].length
  assert.ok(pages > 1)
  assert.ok(text.includes('Prodotto 79'))
  assert.ok(text.includes('Fine nota 79'))
  assert.equal([...text.matchAll(/Copia PDF personale/g)].length, pages, 'Every page needs a footer')
})

test('migration adds owner-only policies without altering existing application tables', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261005000000_shopping_lists.sql'), 'utf8')
  assert.match(sql, /ALTER TABLE public\.shopping_lists ENABLE ROW LEVEL SECURITY/)
  assert.match(sql, /ALTER TABLE public\.shopping_items ENABLE ROW LEVEL SECURITY/)
  assert.match(sql, /FOR ALL TO authenticated[\s\S]*WITH CHECK/)
  assert.match(sql, /list\.user_id = \(SELECT auth\.uid\(\)\)/)
  assert.match(sql, /REFERENCES public\.shopping_lists\(id\) ON DELETE CASCADE/)
  assert.doesNotMatch(sql, /(?:ALTER|DROP|UPDATE|DELETE FROM) (?:TABLE )?public\.(?:work_items|events|profiles|notes)\b/i)
})

const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ShoppingWorkspace = loadTypeScript('platforms/Desktop/app/components/ShoppingWorkspace.tsx', {
  '@/lib/shopping': shopping,
  './shoppingPdf': { createShoppingPdf },
}).default
const fixture = {
  lists: [list], items: [product(), product({ id: 'purchased', name: 'Pane', purchased: true })],
  loading: false, errorMessage: null,
  reload() {}, async createList() {}, async renameList() {}, async deleteList() {},
  async addItem() {}, async updateItem() {}, async deleteItem() {},
}

test('shopping UI renders product states, progress and PDF actions', () => {
  const html = renderToStaticMarkup(React.createElement(ShoppingWorkspace, { data: fixture }))
  for (const label of ['Spesa settimanale', 'Latte', 'Pane', '2 l', 'Senza lattosio', 'Condividi PDF', 'Nuova lista', 'Aggiungi prodotto']) {
    assert.ok(html.includes(label), `Missing UI label: ${label}`)
  }
  assert.ok(html.includes('aria-valuenow="50"'))
  assert.ok(html.includes('aria-label="Segna acquistato: Latte"'))
  assert.ok(html.includes('aria-label="Segna da acquistare: Pane"'))
  assert.ok(html.includes('checked=""'))
})

test('shopping UI exposes loading, empty and failure states with a retry', () => {
  const render = data => renderToStaticMarkup(React.createElement(ShoppingWorkspace, { data }))
  assert.ok(render({ ...fixture, lists: [], items: [], loading: true }).includes('Caricamento spesa...'))
  assert.ok(render({ ...fixture, lists: [], items: [] }).includes('La tua spesa, in ordine'))
  const failed = render({ ...fixture, lists: [], items: [], errorMessage: 'Errore di connessione' })
  assert.ok(failed.includes('role="alert"'))
  assert.ok(failed.includes('Errore di connessione'))
  assert.ok(failed.includes('Riprova'))
  assert.ok(!failed.includes('La tua spesa, in ordine'))
})
