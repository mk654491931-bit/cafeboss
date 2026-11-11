import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readEnv(...keys: string[]): string {
  const env = (import.meta.env ?? {}) as unknown as Record<
    string,
    string | undefined
  >;
  for (const key of keys) {
    const value = env[key];
    if (value) return value;
  }
  return "";
}

const supabaseUrl = readEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const configHint =
  "Supabase yapılandırması eksik. SUPABASE_URL ve SUPABASE_ANON_KEY anahtarlarını tanımlayın.";

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const READ_RETRY_DELAYS_MS = [500, 1500];
const REQUEST_TIMEOUT_MS = 12_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

/**
 * Supabase reads are retried on transient network/HTTP failures. Mutations are
 * intentionally sent only once so a duplicated insert or delete is impossible.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const canRetry = requestMethod(input, init) === "GET";
  const maxAttempts = canRetry ? READ_RETRY_DELAYS_MS.length + 1 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    let timedOut = false;
    const requestSignal =
      init?.signal ??
      (typeof Request !== "undefined" && input instanceof Request
        ? input.signal
        : undefined);
    const abortFromCaller = () => controller.abort();

    if (requestSignal) {
      if (requestSignal.aborted) controller.abort();
      else requestSignal.addEventListener("abort", abortFromCaller, { once: true });
    }

    const timer = globalThis.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      const shouldRetry =
        canRetry &&
        attempt < maxAttempts - 1 &&
        RETRYABLE_STATUS.has(response.status);

      if (!shouldRetry) return response;
      if (response.body) {
        await response.body.cancel().catch(() => undefined);
      }
    } catch (error) {
      // Çağıran taraf isteği bilerek iptal ettiyse yeniden denemeyelim.
      if (requestSignal?.aborted) throw error;

      lastError = timedOut
        ? new Error(
            "Bağlantı zaman aşımına uğradı. İnternetinizi kontrol edip tekrar deneyin.",
          )
        : error;
      if (!canRetry || attempt >= maxAttempts - 1) throw lastError;
    } finally {
      globalThis.clearTimeout(timer);
      requestSignal?.removeEventListener("abort", abortFromCaller);
    }

    await wait(
      READ_RETRY_DELAYS_MS[
        Math.min(attempt, READ_RETRY_DELAYS_MS.length - 1)
      ],
    );
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Veritabanına bağlanılamadı.");
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: fetchWithRetry,
      },
    })
  : null;

/**
 * Writes require a live admin session. Calling getSession before the mutation
 * refreshes an expired access token instead of letting the INSERT/UPDATE fail
 * with a cryptic JWT error after the admin panel has been idle for a while.
 */
export async function authenticatedClient(): Promise<SupabaseClient> {
  if (!supabase) throw new Error(configHint);

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    throw new Error("Oturum süreniz doldu. Lütfen tekrar giriş yapın.");
  }

  return supabase;
}
