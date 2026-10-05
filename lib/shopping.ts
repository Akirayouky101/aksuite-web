export const shoppingUnits = ['pezzi', 'g', 'kg', 'ml', 'l'] as const
export type ShoppingUnit = typeof shoppingUnits[number]

export function isShoppingUnit(value: string): value is ShoppingUnit {
  return shoppingUnits.some(unit => unit === value)
}

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
  quantity_value: number | null
  quantity_unit: ShoppingUnit | null
  notes: string
  purchased: boolean
  created_at: string
}

export type ShoppingItemInput = Pick<ShoppingItem, 'name' | 'quantity_value' | 'notes'> & { quantity_unit: ShoppingUnit }

export function shoppingQuantity(item: Pick<ShoppingItem, 'quantity' | 'quantity_value' | 'quantity_unit'>): string {
  if (item.quantity_value != null && item.quantity_unit) {
    return `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 3 }).format(item.quantity_value)} ${item.quantity_unit}`
  }
  return item.quantity
}

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
  const notes = input.notes.trim()
  if (!name || name.length > 160) throw new Error('Il prodotto deve contenere da 1 a 160 caratteri.')
  const value = input.quantity_value
  if (value === null || !Number.isFinite(value) || value <= 0 || value > 999999999
    || value !== Number(value.toFixed(3))) {
    throw new Error('Inserisci una quantità maggiore di zero, fino a 999999999 e con al massimo 3 decimali.')
  }
  if (!isShoppingUnit(input.quantity_unit)) throw new Error('Seleziona pezzi, g, kg, ml oppure l.')
  if (notes.length > 1000) throw new Error('Le note non possono superare 1000 caratteri.')
  return { name, quantity_value: value, quantity_unit: input.quantity_unit, notes }
}

export function shoppingPdfFilename(title: string): string {
  const slug = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)
  return `spesa-${slug || 'lista'}.pdf`
}
