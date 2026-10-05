import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const apnsKeyId = Deno.env.get("APNS_KEY_ID")!;
const apnsTeamId = Deno.env.get("APNS_TEAM_ID")!;
const apnsPrivateKey = Deno.env.get("APNS_PRIVATE_KEY")!;
const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "com.aksuite.app";
const apnsEnvironment = Deno.env.get("APNS_ENVIRONMENT") ?? "sandbox";

const admin = createClient(supabaseUrl, serviceRoleKey);

interface PushRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function textBase64Url(value: string): string {
  return base64Url(new TextEncoder().encode(value));
}

function pemToBytes(pem: string): Uint8Array {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function createApnsToken(): Promise<string> {
  const header = textBase64Url(JSON.stringify({ alg: "ES256", kid: apnsKeyId }));
  const claims = textBase64Url(JSON.stringify({ iss: apnsTeamId, iat: Math.floor(Date.now() / 1000) }));
  const unsignedToken = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(apnsPrivateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken),
  );
  return `${unsignedToken}.${base64Url(new Uint8Array(signature))}`;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authorization = request.headers.get("Authorization");
  if (!authorization) return new Response("Missing authorization", { status: 401 });

  const payload = await request.json() as PushRequest;
  if (!payload.user_id || !payload.title || !payload.body) {
    return new Response("Invalid payload", { status: 400 });
  }

  const isInternalRequest = authorization === `Bearer ${serviceRoleKey}`;
  if (!isInternalRequest) {
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return new Response("Unauthorized", { status: 401 });
    if (payload.user_id !== user.id) return new Response("Forbidden", { status: 403 });
  }

  const { data: devices, error: devicesError } = await admin
    .from("push_devices")
    .select("id, device_token")
    .eq("user_id", payload.user_id);
  if (devicesError) return new Response(devicesError.message, { status: 500 });
  if (!devices?.length) {
    return Response.json({ error: "No registered APNs devices for this user" }, { status: 404 });
  }

  const token = await createApnsToken();
  const host = apnsEnvironment === "production" ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const results = await Promise.all((devices ?? []).map(async (device) => {
    const response = await fetch(`https://${host}/3/device/${device.device_token}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${token}`,
        "apns-topic": apnsBundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        aps: { alert: { title: payload.title, body: payload.body }, sound: "default", badge: 1 },
        ...(payload.data ?? {}),
      }),
    });
    if (response.status === 410 || response.status === 400) {
      await admin.from("push_devices").delete().eq("id", device.id);
    }
    const responseBody = response.status === 200 ? null : await response.text();
    return { device_id: device.id, status: response.status, error: responseBody };
  }));

  const failed = results.filter((result) => result.status !== 200);
  return Response.json({ sent: results.length - failed.length, failed: failed.length, results }, { status: failed.length === results.length ? 502 : 200 });
});
