# 🧪 Come Testare i Collegamenti - Guida Pratica

## ✅ PREREQUISITO: Database Setup

### 1. Esegui lo Schema SQL

1. Vai su **Supabase Dashboard** → https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Menu laterale → **SQL Editor**
4. Click su **New Query**
5. Copia e incolla questo SQL:

```sql
-- Item Relations Table - Universal linking system
CREATE TABLE IF NOT EXISTS public.item_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  
  relation_type TEXT DEFAULT 'related',
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_relation UNIQUE (user_id, source_type, source_id, target_type, target_id)
);

ALTER TABLE public.item_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own relations"
  ON public.item_relations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own relations"
  ON public.item_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relations"
  ON public.item_relations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relations"
  ON public.item_relations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS item_relations_user_id_idx ON public.item_relations(user_id);
CREATE INDEX IF NOT EXISTS item_relations_source_idx ON public.item_relations(source_type, source_id);
CREATE INDEX IF NOT EXISTS item_relations_target_idx ON public.item_relations(target_type, target_id);
CREATE INDEX IF NOT EXISTS item_relations_type_idx ON public.item_relations(relation_type);
CREATE INDEX IF NOT EXISTS item_relations_composite_idx ON public.item_relations(user_id, source_type, source_id);
```

6. Click **RUN** o premi `Cmd+Enter`
7. Dovresti vedere: "Success. No rows returned"

---

## 🧪 TEST 1: Collegare una Task a una Nota

### Preparazione
1. Apri l'app: `npm run dev` (se non già avviata)
2. Fai login
3. Crea alcuni elementi di test:
   - **1 Task**: "Preparare Demo Prodotto"
   - **1 Nota**: "Specifiche Tecniche Demo"

### Procedura

**PASSO 1 - Vai alle Task**
- Click sull'icona Tasks nella dashboard
- Si apre la lista delle task

**PASSO 2 - Modifica la Task**
- Click sulla task "Preparare Demo Prodotto"
- Si apre il modal di modifica
- Scorri in basso fino alla fine del form

**PASSO 3 - Trova Sezione Collegamenti**
Dovresti vedere:
```
🔗 Collegamenti
─────────────────────────────
[Nessun collegamento ancora]
[+ Aggiungi Collegamento]
```

**PASSO 4 - Aggiungi Collegamento**
- Click su **"+ Aggiungi Collegamento"**
- Si apre il modal di selezione

**PASSO 5 - Seleziona Tipo Entità**
Vedrai 6 bottoni:
```
🔒 Password  📞 Chiamata  ✅ Task
📝 Nota      📅 Evento    💰 Budget
```
- Click su **📝 Nota**

**PASSO 6 - Cerca la Nota**
- Nella barra di ricerca digita: "Specifiche"
- Appare la nota "Specifiche Tecniche Demo"

**PASSO 7 - Scegli Tipo Relazione**
Nel dropdown seleziona:
- **"references"** (fa riferimento a)

**PASSO 8 - Opzionale: Aggiungi Note**
Campo notes:
- Scrivi: "Contiene i requisiti tecnici"

**PASSO 9 - Crea Collegamento**
- Click sulla card della nota
- Il modal si chiude
- Dovresti vedere un messaggio di successo

**PASSO 10 - Verifica Collegamento**
Nella sezione Collegamenti ora dovresti vedere:
```
🔗 Collegamenti
─────────────────────────────
📊 Quick Stats: 1 Note

📝 Note (1)
┌─────────────────────────────────────┐
│ Specifiche Tecniche Demo            │
│ [references] 💭 tooltip con note    │
│ [🔍 Naviga] [❌ Scollega]          │
└─────────────────────────────────────┘
```

**PASSO 11 - Test Bidirezionalità**
- Chiudi il modal della task
- Vai alle Note
- Apri "Specifiche Tecniche Demo"
- Scorri in basso
- Dovresti vedere la task collegata! ✨

---

## 🧪 TEST 2: Collegamento Multi-Entità

### Scenario: Progetto Complesso

**PASSO 1 - Crea Elementi**
1. **Evento**: "Meeting Cliente XYZ - 15 Feb"
2. **Task**: "Preparare Presentazione"
3. **Nota**: "Requisiti Discussi"
4. **Password**: "WiFi Sala Riunioni"

**PASSO 2 - Collega Tutto all'Evento**
1. Modifica l'evento "Meeting Cliente XYZ"
2. Aggiungi collegamento → Task → "Preparare Presentazione" → `implements`
3. Aggiungi collegamento → Nota → "Requisiti Discussi" → `references`
4. Aggiungi collegamento → Password → "WiFi Sala Riunioni" → `related`

**PASSO 3 - Verifica Collegamenti**
Nella sezione collegamenti dell'evento dovresti vedere:
```
📊 Quick Stats: 1 Task, 1 Nota, 1 Password

✅ Task (1)
- Preparare Presentazione [implements]

📝 Note (1)
- Requisiti Discussi [references]

🔒 Password (1)
- WiFi Sala Riunioni [related]
```

**PASSO 4 - Test Navigazione**
1. Nella task "Preparare Presentazione"
2. Vai a Collegamenti
3. Dovresti vedere l'evento collegato
4. Click "Naviga" (quando implementato)

---

## 🧪 TEST 3: Rimozione Collegamenti

**PASSO 1**
- Apri un elemento con collegamenti

**PASSO 2**
- Nella sezione Collegamenti
- Hover su un collegamento
- Appaiono i bottoni azione

**PASSO 3**
- Click su **❌ Scollega**
- Il collegamento viene rimosso
- La lista si aggiorna

**PASSO 4 - Verifica Bidirezionale**
- Apri l'elemento che era collegato
- Il collegamento è stato rimosso anche lì!

---

## 🔍 Debugging

### Collegamento non si crea?

**1. Verifica Console Browser**
```
F12 → Console tab
Cerca errori rossi
```

**2. Verifica Supabase**
```
Dashboard → Table Editor → item_relations
Dovresti vedere i record creati
```

**3. Verifica RLS**
```
SQL Editor → esegui:
SELECT * FROM item_relations;

Se è vuoto ma hai creato collegamenti,
controlla le policies RLS
```

### Non vedo la sezione Collegamenti?

**Causa**: Stai creando un nuovo elemento
**Soluzione**: I collegamenti appaiono solo in modalità EDIT (elemento esistente)

1. Prima CREA e SALVA l'elemento
2. Poi RIAPRI per modificare
3. Ora vedrai la sezione Collegamenti

### Collegamento non appare?

**1. Riapri il modal**
- Chiudi e riapri l'elemento
- I collegamenti si caricano all'apertura

**2. Controlla Network**
```
F12 → Network tab
Cerca chiamate a Supabase
Verifica response
```

---

## ✅ Checklist Test Completati

- [ ] Schema SQL eseguito in Supabase
- [ ] App avviata e login effettuato
- [ ] Task creata e modificata
- [ ] Nota creata
- [ ] Collegamento Task → Nota creato
- [ ] Collegamento visibile in entrambi
- [ ] Evento con multi-collegamenti testato
- [ ] Rimozione collegamento testata
- [ ] Bidirezionalità verificata

---

## 🎉 Risultati Attesi

Dopo i test dovresti:

✅ Vedere la sezione "🔗 Collegamenti" nelle modali di edit
✅ Poter collegare qualsiasi Task/Nota/Evento ad altri elementi
✅ Vedere contatori per tipo (es. "2 Tasks, 1 Password")
✅ Vedere lista raggruppata per tipo
✅ Poter rimuovere collegamenti
✅ Verificare bidirezionalità (collegamento appare su entrambi i lati)

---

## 💡 Esempi Pratici

### Workflow Lavorativo
```
Evento: "Sprint Planning"
  → Task: "Implementare Feature X" (implements)
  → Nota: "User Stories" (references)
  → Password: "Jira Access" (related)
```

### Gestione Cliente
```
Chiamata: "Follow-up Cliente ABC"
  → Task: "Inviare Preventivo" (depends_on)
  → Nota: "Esigenze Cliente" (references)
  → Evento: "Meeting Chiusura" (related)
```

### Progetto Complesso
```
Task: "Lancio Prodotto"
  → Evento: "Presentazione Stampa" (implements)
  → Nota: "Piano Marketing" (references)
  → Password: "Social Media Accounts" (related)
  → Task: "Preparare Press Kit" (depends_on)
  → Transaction: "Budget Evento" (related)
```

---

## 🚀 Prossimi Passi

Dopo aver testato i collegamenti base:

1. **Testa scenari complessi**: Elementi con 5+ collegamenti
2. **Verifica performance**: Molti elementi collegati
3. **Test edge cases**: Collegamento a se stesso (dovrebbe essere filtrato)
4. **Multi-utente**: Due utenti non vedono collegamenti altrui

---

## 📞 Supporto

**Problemi?**
1. Controlla console browser (F12)
2. Verifica Supabase Table Editor
3. Controlla che RLS sia attivo
4. Verifica di essere in modalità EDIT (non creazione)

**Tutto funziona?**
🎉 Hai un sistema di collegamenti universali funzionante!

Prossimi miglioramenti:
- Navigazione tra elementi
- Smart suggestions
- Visualizzazione grafo
- Export collegamenti
