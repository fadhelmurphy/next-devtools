// Next.js 10 only reads CommonJS next.config.js.
const { withNextDevtools } = require("@fadhelmurphy/next-devtools");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withNextDevtools(nextConfig);
