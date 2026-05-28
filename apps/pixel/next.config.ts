import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tarani/shared", "@tarani/gilfoyle"],
};

export default nextConfig;
