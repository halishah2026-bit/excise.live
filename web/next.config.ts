import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow proxy hostnames to access dev-only endpoints like HMR websocket.
  allowedDevOrigins: ["excise.live", "www.excise.live"],
  async headers() {
    return [
      {
        // Avoid stale prerendered HTML pointing to removed chunk files after deploys.
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
