import type { NextConfig } from "next";
import { withNextDevtools } from "@fadhelmurphy/next-devtools";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextDevtools(nextConfig);
