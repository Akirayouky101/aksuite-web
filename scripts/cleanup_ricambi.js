// Analizza e pulisci i prodotti Tecnoalarm RICAMBI dal database
const { createClient } = require('@supabase/supabase-js')

const s = createClient(
  'https://tecvggqaunfbelqksghj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlY3ZnZ3FhdW5mYmVscWtzZ2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM2NzE1NywiZXhwIjoyMDgzOTQzMTU3fQ.yMC1TOZNIub83gfmbUCwWzRvYnZHQz5Ku6WLwEQoZBE'
)

async function main() {
  // Fetch tutti i prodotti Tecnoalarm (paginato)
  let all = []
  let from = 0
  while (true) {
    const { data, error } = await s
      .from('products')
      .select('id,sku,brand,notes,name')
      .eq('brand', 'Tecnoalarm')
      .range(from, from + 999)
    if (error) { console.error('Error:', error); break }
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < 1000) break
    from += 1000
  }

  const ricambi = all.filter(p => p.notes && p.notes.includes('RICAMBI'))
  const prodotti = all.filter(p => p.notes && p.notes.includes('PRODOTTI'))
  const other = all.filter(p => !p.notes || (!p.notes.includes('RICAMBI') && !p.notes.includes('PRODOTTI')))

  console.log('=== ANALISI TECNOALARM ===')
  console.log('Totale:', all.length)
  console.log('  RICAMBI:', ricambi.length)
  console.log('  PRODOTTI:', prodotti.length)
  console.log('  Altro:', other.length)

  // Verifica duplicati SKU
  const skuMap = {}
  all.forEach(p => {
    if (!skuMap[p.sku]) skuMap[p.sku] = []
    skuMap[p.sku].push(p)
  })
  const dupes = Object.entries(skuMap).filter(([k, v]) => v.length > 1)
  console.log('\nSKU duplicati:', dupes.length)
  dupes.slice(0, 10).forEach(([sku, items]) => {
    console.log(`  ${sku} x${items.length}:`, items.map(i => i.notes ? i.notes.substring(0, 30) : 'no note').join(' | '))
  })

  // IDs dei RICAMBI da eliminare
  const ricambiIds = ricambi.map(p => p.id)
  console.log('\n=== IDs RICAMBI da eliminare:', ricambiIds.length, '===')

  if (ricambiIds.length > 0) {
    // Elimina a blocchi di 100
    console.log('Eliminazione in corso...')
    let deleted = 0
    for (let i = 0; i < ricambiIds.length; i += 100) {
      const batch = ricambiIds.slice(i, i + 100)
      const { error } = await s.from('products').delete().in('id', batch)
      if (error) {
        console.error('Errore eliminazione batch:', error)
      } else {
        deleted += batch.length
        console.log(`  Eliminati ${deleted}/${ricambiIds.length}`)
      }
    }
    console.log(`\nDONE! Eliminati ${deleted} ricambi Tecnoalarm`)
  }

  // Verifica dopo
  const { data: remaining } = await s
    .from('products')
    .select('id', { count: 'exact' })
    .eq('brand', 'Tecnoalarm')
    .range(0, 0)
  
  // Conta rimanenti
  let remainCount = 0
  from = 0
  while (true) {
    const { data } = await s.from('products').select('id').eq('brand', 'Tecnoalarm').range(from, from + 999)
    if (!data || data.length === 0) break
    remainCount += data.length
    if (data.length < 1000) break
    from += 1000
  }
  console.log('\nTecnoalarm rimasti:', remainCount)
}

main()
