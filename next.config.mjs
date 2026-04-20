/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer', 'lighthouse', 'better-sqlite3'],
};

export default nextConfig;
