import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prod serves under ziaoliu.io/english (gary, 2026-07-07). basePath is baked
  // at build time: the Docker build sets NEXT_BASE_PATH=/english; dev stays at /.
  basePath: process.env.NEXT_BASE_PATH ?? "",
  // better-sqlite3 is a native addon — keep it external so the standalone trace
  // ships the compiled .node instead of trying to bundle it.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
