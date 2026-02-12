# 🔗 Sistema Collegamenti Multi-Entità - Guida Integrazione

## Componenti Creati

1. **useRelations.ts** - Hook per gestire relazioni
2. **RelationManager.tsx** - UI per creare collegamenti
3. **RelatedItemsPanel.tsx** - Mostra collegamenti esistenti
4. **RelationsIntegration.tsx** - Wrapper che integra tutto

## Come Integrare in una Modal

### Esempio: TaskModal con Collegamenti

```tsx
import RelationsIntegration from './RelationsIntegration'
import { EntityType } from '../hooks/useRelations'

// Nel componente TaskModal, aggiungi queste props:
interface TaskModalProps {
  // ... props esistenti ...
  
  // Nuove props per relazioni
  availableItems?: {
    passwords?: any[]
    calls?: any[]
    notes?: any[]
    events?: any[]
    transactions?: any[]
  }
  onAddRelation?: (targetType: EntityType, targetId: string, ...) => void
  onRemoveRelation?: (relationId: string) => void
  getRelatedItems?: (type: EntityType, id: string, items: any) => Promise<RelatedItem[]>
}

// Nel JSX della modal, aggiungi una nuova sezione:
<div className="p-6 space-y-6">
  {/* Campi form esistenti */}
  
  {/* NUOVA SEZIONE: Collegamenti */}
  <div>
    <h4 className="text-lg font-bold text-white mb-3">🔗 Collegamenti</h4>
    <RelationsIntegration
      entityType="task"
      entityId={editTask?.id || null}
      entityTitle={formData.title}
      availableItems={availableItems || {}}
      onAddRelation={onAddRelation || (() => {})}
      onRemoveRelation={onRemoveRelation || (() => {})}
      getRelatedItems={getRelatedItems || (async () => [])}
    />
  </div>
</div>
```

## Integrazione nel page.tsx

Nel page.tsx principale, passa i dati alle modali:

```tsx
// Prepara i dati disponibili
const availableItems = {
  passwords,
  calls,
  tasks,
  notes,
  events,
  transactions
}

// Nelle chiamate alle modali:
<TaskModal
  {...existingProps}
  availableItems={availableItems}
  onAddRelation={(targetType, targetId, relationType, notes) => {
    if (editingTask?.id) {
      addRelation('task', editingTask.id, targetType, targetId, relationType, notes)
    }
  }}
  onRemoveRelation={removeRelation}
  getRelatedItems={getRelatedItems}
/>
```

## Funzionalità Implementate

✅ **Collegamenti Many-to-Many** - Qualsiasi entità può essere collegata a qualsiasi altra
✅ **Tipi di Relazione** - related, depends_on, blocks, implements, references
✅ **Note Collegamento** - Aggiungi note opzionali a ogni collegamento
✅ **Ricerca e Filtri** - Trova facilmente gli elementi da collegare
✅ **Visualizzazione Raggruppata** - Collegamenti mostrati per tipo
✅ **Quick Actions** - Naviga o rimuovi collegamenti con un click
✅ **Contatori** - Vedi quanti collegamenti per tipo
✅ **Supporto Offline** - Funziona anche senza Supabase

## Database Schema

```sql
CREATE TABLE item_relations (
  id UUID PRIMARY KEY,
  user_id UUID,
  source_type TEXT, -- 'password', 'call', 'task', 'note', 'event', 'transaction'
  source_id UUID,
  target_type TEXT,
  target_id UUID,
  relation_type TEXT,
  notes TEXT,
  created_at TIMESTAMP
);
```

## Prossimi Passi

1. Integrare in TUTTE le modali (Password, Call, Note, Event, Budget)
2. Aggiungere smart suggestions ("Vuoi creare un evento da questa chiamata?")
3. Dashboard con grafo relazioni
4. Navigazione rapida tra elementi collegati
