/** @type {import('next').NextConfig} */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let supabaseHost = "*.supabase.co";
try {
  if (supabaseUrl) supabaseHost = new URL(supabaseUrl).host;
} catch {}

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: https://*.lemonsqueezy.com",
  "font-src 'self'",
  // api.flutterwave.com retiré tant que Flutterwave est désactivé (voir lib/payment/flutterwave.ts).
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.fedapay.com https://api.lemonsqueezy.com https://api.openai.com wss://api.openai.com https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com`,
  "frame-src 'self' https://*.lemonsqueezy.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      // Force the browser-compatible bundle (same as the webpack alias below).
      // Turbopack ignores the webpack() callback, so this alias must be set here.
      "@react-pdf/renderer":
        "@react-pdf/renderer/lib/react-pdf.browser.js",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @react-pdf/renderer's exports field has no "browser" condition, so webpack 5
      // resolves the Node.js bundle (which uses fs/buffer) for client code.
      // Force the browser-compatible bundle explicitly.
      config.resolve.alias["@react-pdf/renderer"] = require.resolve(
        "@react-pdf/renderer/lib/react-pdf.browser.js"
      );
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
