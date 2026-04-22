-- ═══════════════════════════════════════════════════════════
-- hr_work_records: aggiungi break_minutes
-- break_minutes = 60  → pausa default 1 ora (scalata dalle ore lavorate)
-- break_minutes = 0   → turno continuato, nessuna pausa
-- break_minutes = N   → pausa personalizzata (15, 30, 45…)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.hr_work_records
  ADD COLUMN IF NOT EXISTS break_minutes INTEGER NOT NULL DEFAULT 60;

-- I record esistenti mantengono il default 60 (retroattivo coerente)
