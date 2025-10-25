// Unified CSP source of truth for Next.js headers() and vercel.json
// OWASP ASVS L2 aligned defaults. Preserve compatibility with existing endpoints.
// Do NOT include secrets. Use env flags only to widen connect-src when needed.

export type CspDirectives = Record<string, string[]>;

export interface CspOptions {
  isDev?: boolean;
  extraConnectSrc?: string[]; // allow extensions without changing core policy
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

function add(arr: string[], values: string[] = []): string[] {
  return uniq([...arr, ...values]);
}

// Build header string from directives object; handles flag directives without values.
export function buildCspHeader(directives: CspDirectives): string {
  const parts: string[] = [];
  for (const [key, values] of Object.entries(directives)) {
    if (!values || values.length === 0) {
      parts.push(`${key}`);
    } else {
      parts.push(`${key} ${values.join(" ")}`);
    }
  }
  return parts.join("; ");
}

// Normalize a CSP header string for comparison (used by CI sync check).
export function normalizeCspHeader(header: string): string {
  return header
    .trim()
    .replace(/\s+/g, " ")
    .replace(/;\s*/g, "; ")
    .toLowerCase();
}

// Default directives; keep in sync with Next headers() and vercel.json
export function getCspDirectives(opts: CspOptions = {}): CspDirectives {
  const isDev = !!opts.isDev || process.env.NODE_ENV === "development";

  const defaultSrc = ["'self'"];

  const scriptSrc = [
    "'self'",
    "'wasm-unsafe-eval'", // required by wasm pipelines (Next/Telegram)
    "https://telegram.org",
    "https://vercel.live",
  ];

  const styleSrc = [
    "'self'",
    "'unsafe-inline'", // Tailwind/inline styles (documented)
  ];

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://*.ipfs.io",
    "https://*.ipfs.dweb.link",
    "https://ipfs.io",
    "https://gateway.pinata.cloud",
    "https://cloudflare-ipfs.com",
  ];

  const connectSrcBase = [
    "'self'",
    "https://api.mainnet-beta.solana.com",
    "wss://api.mainnet-beta.solana.com",
    "https://ton.org",
    "https://tonapi.io",
    "https://*.sentry.io",
  ];

  const devConnectSrc = [
    "http://127.0.0.1:*",
    "http://localhost:*",
    "ws://127.0.0.1:*",
    "ws://localhost:*",
  ];

  const connectSrc = add(connectSrcBase, [
    ...(isDev ? devConnectSrc : []),
    ...(opts.extraConnectSrc || []),
  ]);

  const fontSrc = ["'self'", "data:"];
  const objectSrc = ["'none'"];
  const baseUri = ["'self'"];
  const formAction = ["'self'"];
  const frameAncestors = ["'none'"];

  // upgrade-insecure-requests is a flag directive (no values)
  const directives: CspDirectives = {
    "default-src": defaultSrc,
    "script-src": scriptSrc,
    "style-src": styleSrc,
    "img-src": imgSrc,
    "connect-src": connectSrc,
    "font-src": fontSrc,
    "object-src": objectSrc,
    "base-uri": baseUri,
    "form-action": formAction,
    "frame-ancestors": frameAncestors,
    "upgrade-insecure-requests": [], // flag
  };

  return directives;
}

// Convenience wrapper to get final header string
export function getCspHeader(opts: CspOptions = {}): string {
  return buildCspHeader(getCspDirectives(opts));
}

// Export JSON representation for vercel.json generation if needed
export function getCspHeaderForVercel(): string {
  // Vercel expects a string identical to Next headers()
  return getCspHeader({ isDev: false });
}
