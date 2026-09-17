-- AK Suite: keep only the personal browser modules.
-- Review this list before running it in the Supabase SQL Editor.
-- Kept: profiles, passwords, calls, calls_timeline, events, notes, clients,
-- user_permissions and activity_logs (required by user management auditing).
BEGIN;

DROP TABLE IF EXISTS public.kiosk_notes CASCADE;
DROP TABLE IF EXISTS public.item_relations CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.budget_transactions CASCADE;
DROP TABLE IF EXISTS public.budget_recurring CASCADE;
DROP TABLE IF EXISTS public.budget_limits CASCADE;
DROP TABLE IF EXISTS public.visits CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.preventivi CASCADE;
DROP TABLE IF EXISTS public.sopralluoghi CASCADE;
DROP TABLE IF EXISTS public.lavorazione_ore CASCADE;
DROP TABLE IF EXISTS public.lavorazione_materiali CASCADE;
DROP TABLE IF EXISTS public.lavorazioni_timeline CASCADE;
DROP TABLE IF EXISTS public.lista_lavorazione_users CASCADE;
DROP TABLE IF EXISTS public.lista_lavorazione_items CASCADE;
DROP TABLE IF EXISTS public.liste_lavorazioni CASCADE;
DROP TABLE IF EXISTS public.lavorazioni CASCADE;
DROP TABLE IF EXISTS public.installation_cameras CASCADE;
DROP TABLE IF EXISTS public.device_credentials CASCADE;
DROP TABLE IF EXISTS public.device_hdds CASCADE;
DROP TABLE IF EXISTS public.installation_devices CASCADE;
DROP TABLE IF EXISTS public.installations CASCADE;
DROP TABLE IF EXISTS public.gate_maintenances CASCADE;
DROP TABLE IF EXISTS public.gates CASCADE;
DROP TABLE IF EXISTS public.verifiche_campi_definizioni CASCADE;
DROP TABLE IF EXISTS public.verifiche_tecnoalarm CASCADE;
DROP TABLE IF EXISTS public.hr_modification_codes CASCADE;
DROP TABLE IF EXISTS public.hr_work_records CASCADE;
DROP TABLE IF EXISTS public.hr_leave_requests CASCADE;
DROP TABLE IF EXISTS public.hr_documents CASCADE;
DROP TABLE IF EXISTS public.hr_profiles CASCADE;
DROP TABLE IF EXISTS public.ticket_attachments CASCADE;
DROP TABLE IF EXISTS public.ticket_assignees CASCADE;
DROP TABLE IF EXISTS public.ticket_replies CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.warehouse_requests CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.kit_items CASCADE;
DROP TABLE IF EXISTS public.kits CASCADE;
DROP TABLE IF EXISTS public.impegni_magazzino CASCADE;
DROP TABLE IF EXISTS public.infrastructure_items CASCADE;

COMMIT;
