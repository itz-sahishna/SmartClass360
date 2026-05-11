/**
 * Dynamic CORS allowlist for credentialed requests (cannot use Access-Control-Allow-Origin: *).
 *
 * Allows:
 * - http(s)://localhost and 127.0.0.1 (any port)
 * - Any host ending in .vercel.app (production + preview deployments)
 * - Exact origins listed in FRONTEND_URL (comma / semicolon / whitespace separated)
 */

function parseFrontendUrlEnv() {
  const raw = process.env.FRONTEND_URL;
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toOrigin(entry) {
  if (!entry) return null;
  try {
    const withScheme = entry.includes("://") ? entry : `https://${entry}`;
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;

  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) {
    return true;
  }

  for (const entry of parseFrontendUrlEnv()) {
    const allowed = toOrigin(entry);
    if (allowed && allowed === origin) {
      return true;
    }
  }

  return false;
}

function corsOriginDelegate(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }
  return callback(null, false);
}

module.exports = {
  isAllowedOrigin,
  corsOriginDelegate,
};
