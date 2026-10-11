const { withNextDevtools } = require("@fadhelmurphy/next-devtools");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server Actions are opt-in on Next 13.
  experimental: { serverActions: true },
};

module.exports = withNextDevtools(nextConfig);
