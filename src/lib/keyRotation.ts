import { supabase } from "@/integrations/supabase/client";

export type ProviderKey = {
  id: string;
  provider: string;
  model: string;
  api_key: string;
  label: string | null;
  priority: number;
  is_active: boolean;
  last_status: string | null;
  disabled_until: string | null;
  failure_count: number;
};

/** Pick the next active, non-disabled key by priority. */
export async function pickNextKey(userId: string): Promise<ProviderKey | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .or(`disabled_until.is.null,disabled_until.lt.${nowIso}`)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as ProviderKey) ?? null;
}

export type KeyResult =
  | { kind: "ok" }
  | { kind: "rate_limit"; retryAfterSec?: number }
  | { kind: "out_of_credit" }
  | { kind: "invalid" }
  | { kind: "error"; statusCode?: number; message?: string };

/** Update a key's status after use and record an event. */
export async function markKeyResult(
  userId: string,
  key: ProviderKey,
  result: KeyResult,
): Promise<void> {
  const patch: {
    last_used_at?: string;
    last_status?: string | null;
    failure_count?: number;
    disabled_until?: string | null;
    is_active?: boolean;
  } = { last_used_at: new Date().toISOString() };
  let event = "used";
  let statusCode: number | null = null;
  let detail: string | null = null;

  if (result.kind === "ok") {
    patch.last_status = "ok";
    patch.failure_count = 0;
    patch.disabled_until = null;
  } else if (result.kind === "rate_limit") {
    patch.last_status = "rate_limit";
    patch.failure_count = key.failure_count + 1;
    const wait = (result.retryAfterSec ?? 600) * 1000;
    patch.disabled_until = new Date(Date.now() + wait).toISOString();
    event = "failover";
    statusCode = 429;
  } else if (result.kind === "out_of_credit") {
    patch.last_status = "out_of_credit";
    patch.failure_count = key.failure_count + 1;
    // re-check in 24h
    patch.disabled_until = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    event = "failover";
    statusCode = 402;
  } else if (result.kind === "invalid") {
    patch.last_status = "invalid";
    patch.failure_count = key.failure_count + 1;
    patch.is_active = false;
    event = "failover";
    statusCode = 401;
  } else {
    patch.last_status = "error";
    patch.failure_count = key.failure_count + 1;
    event = "error";
    statusCode = result.statusCode ?? null;
    detail = result.message ?? null;
  }

  await supabase.from("ai_providers").update(patch).eq("id", key.id);
  await supabase.from("ai_key_events").insert({
    user_id: userId,
    provider_id: key.id,
    event,
    status_code: statusCode,
    detail,
  });
}

/** Re-enable a key manually (clear disabled_until + reset status). */
export async function resetKey(keyId: string): Promise<void> {
  await supabase
    .from("ai_providers")
    .update({
      disabled_until: null,
      failure_count: 0,
      last_status: null,
      is_active: true,
    })
    .eq("id", keyId);
}

/**
 * Simulate a real image generation. Since we do not yet call OpenAI/Lovable AI
 * end-to-end from this build, this picks a key, records a "used" event, and
 * returns a stock image. For demo/testing you can force a failover result via
 * `forceResult` (e.g. mark the current key as out_of_credit and rotate).
 */
export async function generateWithFailover(
  userId: string,
  stockPool: string[],
  opts?: { forceResult?: KeyResult["kind"] },
): Promise<{ imageUrl: string; usedKey: ProviderKey | null; failovers: number }> {
  let failovers = 0;
  let attempts = 0;
  // Try up to 5 keys deep
  while (attempts < 5) {
    attempts++;
    const key = await pickNextKey(userId);
    if (!key) {
      // No key configured — degrade gracefully to Lovable AI default (mock)
      const url = stockPool[Math.floor(Math.random() * stockPool.length)];
      return { imageUrl: url, usedKey: null, failovers };
    }

    const force = opts?.forceResult;
    if (force && force !== "ok") {
      await markKeyResult(userId, key, { kind: force });
      failovers++;
      continue;
    }

    // Real integration would call the provider here. Success path:
    await markKeyResult(userId, key, { kind: "ok" });
    const url = stockPool[Math.floor(Math.random() * stockPool.length)];
    return { imageUrl: url, usedKey: key, failovers };
  }
  const url = stockPool[Math.floor(Math.random() * stockPool.length)];
  return { imageUrl: url, usedKey: null, failovers };
}