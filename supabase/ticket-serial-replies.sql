-- ═══════════════════════════════════════════════════════════
-- Ticket: serial number + replies
-- ═══════════════════════════════════════════════════════════

-- 1. Add serial_number to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS serial_number INTEGER;

CREATE SEQUENCE IF NOT EXISTS tickets_serial_seq START 1;

-- Backfill existing rows in creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM tickets
)
UPDATE tickets SET serial_number = numbered.rn
FROM numbered WHERE tickets.id = numbered.id AND tickets.serial_number IS NULL;

-- Sync sequence to current max
SELECT setval('tickets_serial_seq', COALESCE((SELECT MAX(serial_number) FROM tickets), 0) + 1);

-- Set default for new rows
ALTER TABLE tickets ALTER COLUMN serial_number SET DEFAULT nextval('tickets_serial_seq');

-- 2. Create ticket_replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  author_id  UUID        REFERENCES auth.users(id),
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ticket_replies_select" ON ticket_replies;
CREATE POLICY "ticket_replies_select" ON ticket_replies
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ticket_replies_insert" ON ticket_replies;
CREATE POLICY "ticket_replies_insert" ON ticket_replies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ticket_replies_delete" ON ticket_replies;
CREATE POLICY "ticket_replies_delete" ON ticket_replies
  FOR DELETE USING (auth.uid() = author_id);

-- Index
CREATE INDEX IF NOT EXISTS ticket_replies_ticket_id_idx ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS ticket_replies_created_at_idx ON ticket_replies(created_at);
