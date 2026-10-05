import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey);

interface CalendarReminder {
  reminder_id: string;
  event_id: string;
  user_id: string;
  title: string;
}

interface PushReminder { reminder_id: string; source_type: string; source_id: string; user_id: string; title: string; body: string; }

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { data: reminders, error } = await admin.rpc("claim_calendar_reminders", { p_limit: 100 });
  if (error) return new Response(error.message, { status: 500 });

  const results = await Promise.all((reminders as CalendarReminder[] ?? []).map(async (reminder) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: reminder.user_id,
          title: "Evento in programma",
          body: reminder.title,
          data: { destination: "calendar", id: reminder.event_id },
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        await admin.from("calendar_reminders").update({ last_error: errorMessage, claimed_at: null }).eq("id", reminder.reminder_id);
        return { reminder_id: reminder.reminder_id, sent: false, error: errorMessage };
      }

      await admin.from("calendar_reminders").update({ sent_at: new Date().toISOString(), last_error: null }).eq("id", reminder.reminder_id);
      return { reminder_id: reminder.reminder_id, sent: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await admin.from("calendar_reminders").update({ last_error: errorMessage, claimed_at: null }).eq("id", reminder.reminder_id);
      return { reminder_id: reminder.reminder_id, sent: false, error: errorMessage };
    }
  }));

  const { data: pushReminders, error: pushError } = await admin.rpc("claim_push_reminders", { p_limit: 100 });
  if (pushError) return new Response(pushError.message, { status: 500 });
  const pushResults = await Promise.all((pushReminders as PushReminder[] ?? []).map(async (reminder) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, { method: "POST", headers: { Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ user_id: reminder.user_id, title: reminder.title, body: reminder.body, data: { destination: reminder.source_type, id: reminder.source_id } }) });
      if (!response.ok) { const errorMessage = await response.text(); await admin.from("push_reminders").update({ last_error: errorMessage, claimed_at: null }).eq("id", reminder.reminder_id); return { reminder_id: reminder.reminder_id, sent: false, error: errorMessage }; }
      await admin.from("push_reminders").update({ sent_at: new Date().toISOString(), last_error: null }).eq("id", reminder.reminder_id);
      await admin.rpc("advance_recurring_reminder", { p_source_type: reminder.source_type, p_source_id: reminder.source_id });
      return { reminder_id: reminder.reminder_id, sent: true };
    } catch (error) { const errorMessage = error instanceof Error ? error.message : "Unknown error"; await admin.from("push_reminders").update({ last_error: errorMessage, claimed_at: null }).eq("id", reminder.reminder_id); return { reminder_id: reminder.reminder_id, sent: false, error: errorMessage }; }
  }));

  return Response.json({ processed: results.length + pushResults.length, results: [...results, ...pushResults] });
});