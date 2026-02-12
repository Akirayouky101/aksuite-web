# 🚀 Sistema Registro Visite - Deploy Instructions

## 📋 Panoramica
Sistema completo per gestire i visitatori in ufficio con supporto collegamenti universali.

## ✅ Componenti Creati

### 1. **Database Schema**
- ✅ `supabase/visits-schema.sql` - Tabella visits completa
- ✅ `supabase/relations-schema.sql` - Aggiornato per supportare 'visit'

### 2. **Hooks**
- ✅ `app/hooks/useVisits.ts` - CRUD completo (add, update, delete, updateStatus)
- ✅ `app/hooks/useRelations.ts` - Aggiornato EntityType con 'visit'

### 3. **Componenti UI**
- ✅ `app/components/VisitModal.tsx` - Form aggiunta/modifica visite
- ✅ `app/components/VisitsListModal.tsx` - Lista visite con filtri e ricerca

### 4. **Integrazione**
- ✅ `app/page.tsx` - Card "Registro Visite" aggiunta alla dashboard

## 🗄️ SQL DA ESEGUIRE IN SUPABASE

### Passaggio 1: Esegui schema visite
```sql
-- Visits Table - Track office visitors
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Visitor information
  visitor_name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  
  -- Visit details
  visit_type TEXT NOT NULL, -- 'riunione', 'colloquio', 'consegna', 'assistenza', 'altro'
  priority TEXT DEFAULT 'media', -- 'urgente', 'alta', 'media', 'bassa'
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  
  -- Follow-up
  follow_up BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own visits"
  ON public.visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits"
  ON public.visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits"
  ON public.visits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visits"
  ON public.visits FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS visits_user_id_idx ON public.visits(user_id);
CREATE INDEX IF NOT EXISTS visits_date_idx ON public.visits(visit_date);
CREATE INDEX IF NOT EXISTS visits_status_idx ON public.visits(status);
CREATE INDEX IF NOT EXISTS visits_composite_idx ON public.visits(user_id, visit_date DESC);

-- Update the item_relations table to support 'visit' type
COMMENT ON TABLE public.visits IS 'Office visitors registry - tracks people visiting the office';
```

### Passaggio 2: Verifica tabella creata
```sql
SELECT * FROM public.visits LIMIT 1;
```

### Passaggio 3: Verifica RLS policies
```sql
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'visits';
```

## 🧪 TESTING

### 1. Dopo deploy su Vercel:
1. **Hard refresh** (Cmd+Shift+R) per pulire cache
2. **Clicca card "👥 REGISTRO VISITE"**
3. **Aggiungi una visita di prova**
   - Nome: "Mario Rossi"
   - Azienda: "Test Corp"
   - Tipo: Riunione
   - Data: Oggi
4. **Verifica lista visite**
5. **Testa filtri** (Programmate, In Corso, Completate)
6. **Testa modifica** (click su "✏️ Modifica")
7. **Testa eliminazione**

### 2. Collegamenti (dopo aver aggiunto altre entità):
1. **Crea una visita**
2. **Modifica la visita**
3. **Scorri fino a "🔗 Collegamenti"** (se presente - da implementare)
4. **Collega password, chiamata, task o nota**
5. **Verifica bidirezionalità**

## 📊 FEATURES IMPLEMENTATE

✅ **CRUD Completo**
- Aggiungi visita
- Modifica visita
- Elimina visita
- Cambio stato (Programmata → In Corso → Completata)

✅ **Filtri & Ricerca**
- Filtra per stato (Tutte, Programmate, In Corso, Completate)
- Ricerca per nome, azienda, telefono

✅ **Informazioni Visitatore**
- Nome visitatore (obbligatorio)
- Azienda
- Telefono
- Email

✅ **Dettagli Visita**
- Tipo visita (Riunione, Colloquio, Consegna, Assistenza, Altro)
- Priorità (Urgente, Alta, Media, Bassa)
- Data e ora visita
- Note
- Follow-up con data

✅ **Stati Visita**
- 📅 Programmata
- ⏳ In Corso
- ✅ Completata
- ❌ Annullata

✅ **Integrazione Dashboard**
- Card dedicata con contatore visite
- Apertura diretta lista visite
- Design coerente con altre card

## 🔗 COLLEGAMENTI (Sistema Universale)

Il sistema visite è integrato nel sistema collegamenti universali:
- **visit** può essere collegato a: password, call, task, note, event, transaction
- Collegamenti bidirezionali automatici
- Tipi relazione: related, depends_on, blocks, implements, references

## 📝 NOTE TECNICHE

### Tipi Visit
```typescript
interface Visit {
  id: string
  user_id: string
  visitor_name: string
  company: string
  phone: string
  email: string
  visit_type: 'riunione' | 'colloquio' | 'consegna' | 'assistenza' | 'altro'
  priority: 'urgente' | 'alta' | 'media' | 'bassa'
  visit_date: string
  notes: string
  follow_up: boolean
  follow_up_date: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}
```

### Hook useVisits
```typescript
const {
  visits,
  user,
  loading,
  addVisit,
  updateVisit,
  deleteVisit,
  updateVisitStatus
} = useVisits()
```

## 🚀 DEPLOY CHECKLIST

- [x] Schema SQL creato
- [x] Hook useVisits implementato
- [x] VisitModal creato
- [x] VisitsListModal creato
- [x] Integrato in page.tsx
- [x] Sistema collegamenti aggiornato
- [ ] Eseguire SQL in Supabase
- [ ] Deploy su Vercel
- [ ] Test completo

## 🎯 PROSSIMI PASSI

1. **Esegui SQL** in Supabase SQL Editor
2. **Aspetta deploy** su Vercel (automatico dopo push)
3. **Hard refresh** browser
4. **Testa sistema visite** completo
5. **Verifica collegamenti** con altre entità (se già implementate)

---

**Sistema creato con ❤️ per gestire visitatori in ufficio professionalmente! 🏢👥**
