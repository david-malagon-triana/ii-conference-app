import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: instrumentation.ts is a stable (non-experimental) Next.js feature as of this
  // project's Next.js version (16.x), so no `experimental.instrumentationHook` flag is
  // needed (and the flag no longer exists in this version's config type).
};

export default nextConfig;
