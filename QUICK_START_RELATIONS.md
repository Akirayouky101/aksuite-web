# ⚡ Quick Start - Sistema Collegamenti

## 🎯 Stato Attuale

✅ **COMPLETATO:**
- Database schema (`supabase/relations-schema.sql`)
- Hook useRelations
- Componenti UI (RelationManager, RelatedItemsPanel, RelationsIntegration)
- Integrato in: **TaskModal**, **NoteModal**, **EventModal**
- page.tsx configurato con dati e callbacks

## 🚀 PROSSIMI PASSI

### 1. Esegui Database Schema (IMPORTANTE!)

Vai su [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) ed esegui:

```sql
-- Copia e incolla il contenuto di: supabase/relations-schema.sql
```

### 2. Testa il Sistema

1. **Modifica una Task esistente**
   - Apri Tasks List
   - Click su una task
   - Scorri in basso fino a "🔗 Collegamenti"
   
2. **Crea un collegamento**
   - Click "+ Aggiungi Collegamento"
   - Seleziona tipo entità (es. Note)
   - Cerca e seleziona l'elemento
   - Scegli tipo relazione
   - Aggiungi note (opzionale)
   - Click sull'elemento per collegare

3. **Verifica bidirezionalità**
   - Apri la nota collegata
   - Dovresti vedere la task nella sezione Collegamenti!

### 3. Completa Integrazione (Opzionale)

Le modali **PasswordModal**, **CallModal** e **BudgetModal** non hanno ancora:
- Funzionalità di edit
- Integrazione collegamenti

Per completarle:
1. Aggiungi supporto `editPassword/editCall/editTransaction`
2. Integra RelationsIntegration seguendo il pattern di TaskModal

## 📁 File Creati

```
app/
  hooks/
    ✅ useRelations.ts
  components/
    ✅ RelationManager.tsx
    ✅ RelatedItemsPanel.tsx
    ✅ RelationsIntegration.tsx
    ✅ TaskModal.tsx (aggiornato)
    ✅ NoteModal.tsx (aggiornato)
    ✅ EventModal.tsx (aggiornato)
  ✅ page.tsx (aggiornato)

supabase/
  ✅ relations-schema.sql

📖 RELATIONS_COMPLETE_SETUP.md (documentazione completa)
📖 RELATIONS_INTEGRATION_GUIDE.md (guida integrazione)
```

## 🎮 Come Usare

### Nella UI:

1. **Apri un elemento esistente** (Task/Note/Evento)
2. **Trova sezione "🔗 Collegamenti"** (in fondo al form)
3. **Vedi due pannelli:**
   - **Collegamenti Attuali** (con badge, contatori, azioni)
   - **Aggiungi Collegamento** (bottone)

### Azioni Disponibili:

- **➕ Aggiungi** → Apre modal di selezione
- **🔍 Naviga** → Vai all'elemento collegato (da implementare)
- **❌ Scollega** → Rimuove collegamento

### Informazioni Mostrate:

- **Contatori veloci** (es. "2 Tasks, 1 Password, 3 Notes")
- **Lista raggruppata** per tipo
- **Badge tipo relazione** (related, depends_on, etc.)
- **Note collegamento** (tooltip hover)

## 💡 Esempi Pratici

### Scenario 1: Organizzare Progetto
```
Task: "Sviluppo Feature X"
  → Note: "Specifiche Tecniche"
  → Event: "Demo al Cliente"
  → Password: "Credenziali Staging"
```

### Scenario 2: Gestione Cliente
```
Call: "Chiamata Cliente ABC"
  → Password: "Accesso CRM"
  → Task: "Inviare Preventivo"
  → Note: "Requisiti Discussi"
  → Event: "Meeting Follow-up"
  → Transaction: "Budget Proposta"
```

## ⚠️ Limitazioni Attuali

- Collegamenti disponibili solo in modalità **EDIT** (non in creazione)
- Modali senza edit (Password, Call, Budget) non hanno collegamenti
- Navigazione tra elementi da implementare
- Smart suggestions da implementare

## 🔧 Troubleshooting

**Non vedo la sezione Collegamenti:**
- Controlla che stai **modificando** un elemento esistente
- La sezione appare solo se `editTask/editNote/editEvent` ha un ID

**Errore al creare collegamento:**
- Verifica di aver eseguito `relations-schema.sql` in Supabase
- Controlla console browser per dettagli errore

**Collegamenti non si vedono:**
- Ricarica la modal (chiudi e riapri)
- Controlla Supabase Table Editor → item_relations

## 📊 Statistiche Sistema

- **6 tipi di entità** supportati
- **5 tipi di relazione** disponibili
- **Many-to-many** illimitati
- **Bidirectional** automatico
- **RLS secure** (user isolation)

## 🎉 Risultato

Hai ora un sistema di **collegamenti universali** tra tutte le entità di AKSuite!

Ogni Task/Note/Evento può essere collegato a:
- 🔒 Password
- 📞 Chiamate
- ✅ Task
- 📝 Note
- 📅 Eventi
- 💰 Transazioni

**Con relazioni semantiche:**
- `related` - Collegato genericamente
- `depends_on` - Dipende da
- `blocks` - Blocca
- `implements` - Implementa
- `references` - Fa riferimento a

**Enjoy your interconnected workspace! 🚀**
