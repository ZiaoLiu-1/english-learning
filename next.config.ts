import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prod serves under ziaoliu.io/english (gary, 2026-07-07). basePath is baked
  // at build time: the Docker build sets NEXT_BASE_PATH=/english; dev stays at /.
  basePath: process.env.NEXT_BASE_PATH ?? "",
};

export default nextConfig;
