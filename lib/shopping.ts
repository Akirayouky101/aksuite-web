export interface ShoppingList {
  id: string
  user_id: string
  title: string
  created_at: string
}

export interface ShoppingItem {
  id: string
  list_id: string
  name: string
  quantity: string
  notes: string
  purchased: boolean
  created_at: string
}

export type ShoppingItemInput = Pick<ShoppingItem, 'name' | 'quantity' | 'notes'>

export function shoppingProgress(items: readonly ShoppingItem[]) {
  const purchased = items.filter(item => item.purchased).length
  return {
    purchased,
    total: items.length,
    remaining: items.length - purchased,
    percent: items.length ? Math.round(purchased / items.length * 100) : 0,
  }
}

export function validateShoppingTitle(value: string): string {
  const title = value.trim()
  if (!title || title.length > 120) throw new Error('Il nome della lista deve contenere da 1 a 120 caratteri.')
  return title
}

export function validateShoppingItem(input: ShoppingItemInput): ShoppingItemInput {
  const name = input.name.trim()
  const quantity = input.quantity.trim()
  const notes = input.notes.trim()
  if (!name || name.length > 160) throw new Error('Il prodotto deve contenere da 1 a 160 caratteri.')
  if (quantity.length > 60) throw new Error('La quantità non può superare 60 caratteri.')
  if (notes.length > 1000) throw new Error('Le note non possono superare 1000 caratteri.')
  return { name, quantity, notes }
}

export function shoppingPdfFilename(title: string): string {
  const slug = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)
  return `spesa-${slug || 'lista'}.pdf`
}
