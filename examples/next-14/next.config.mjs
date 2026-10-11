import { withNextDevtools } from "@fadhelmurphy/next-devtools";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withNextDevtools(nextConfig);
