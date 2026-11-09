const REQUEST_TIMEOUT_MS = 8000;
const CHECKS = [
  "/rest/v1/products?select=id&limit=1",
  "/rest/v1/site_content?select=key&limit=1",
  "/rest/v1/products?select=id&limit=1",
];

function config() {
  return {
    url:
      process.env.SUPABASE_URL?.trim() ||
      process.env.VITE_SUPABASE_URL?.trim() ||
      "",
    key:
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
      "",
  };
}

async function ping(baseUrl, key, path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    await response.text();
    return response.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Called once a day by Vercel Cron. Three lightweight reads keep a Supabase
 * Free project above its inactivity threshold; they never expose project keys
 * and do not change any application data.
 */
export default async function handler(request, response) {
  if (request.method && request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { url, key } = config();
  if (!url || !key) {
    return response.status(503).json({ ok: false, error: "missing_env" });
  }

  const statuses = await Promise.all(
    CHECKS.map((path) => ping(url, key, path)),
  );
  const ok = statuses.every((status) => status >= 200 && status < 300);

  response.setHeader("Cache-Control", "no-store");
  return response.status(ok ? 200 : 502).json({
    ok,
    checks: statuses.length,
    statuses,
    checkedAt: new Date().toISOString(),
  });
}
