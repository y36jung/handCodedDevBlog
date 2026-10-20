import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Perf tooling: react-scan is dev-only; swap it for a no-op in production builds
    resolveAlias: process.env.NODE_ENV === "production"
      ? { "react-scan": "./app/_components/react-scan-noop.ts" }
      : {},
  },
};

export default nextConfig;
