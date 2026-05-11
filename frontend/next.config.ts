import type { NextConfig } from "next";

/**
 * Vercel expects the default `.next` build directory and its own serverless
 * pipeline. A custom `distDir` (e.g. `dist-next`) breaks route / manifest
 * detection during deploy. Omit `output: "standalone"` here — that mode is
 * for self-hosted Node/Docker; Vercel applies its own deployment layout.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
