-- Note condivise del magazzino (kiosk Giuliano & Lorenzo)
create table if not exists kiosk_notes (
  id         uuid        primary key default gen_random_uuid(),
  content    text        not null,
  author     text        not null default '',
  created_at timestamptz default now()
);

alter table kiosk_notes enable row level security;

-- Tutti gli utenti autenticati possono leggere, inserire e cancellare le note kiosk
create policy "kiosk_notes_select" on kiosk_notes
  for select using (auth.role() = 'authenticated');

create policy "kiosk_notes_insert" on kiosk_notes
  for insert with check (auth.role() = 'authenticated');

create policy "kiosk_notes_update" on kiosk_notes
  for update using (auth.role() = 'authenticated');

create policy "kiosk_notes_delete" on kiosk_notes
  for delete using (auth.role() = 'authenticated');
