import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy — scoped to what the app actually loads:
// Razorpay checkout (script/frame/connect), R2 images + presigned uploads,
// self-hosted next/font, and optional Google avatars.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://*.razorpay.com",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.razorpay.com https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com https://*.r2.cloudflarestorage.com",
  "frame-src 'self' https://*.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

// CSP + HSTS only in production so local dev (HMR uses eval, ws) isn't broken.
const securityHeaders = [
  ...(isProd
    ? [
        { key: "Content-Security-Policy", value: csp },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
