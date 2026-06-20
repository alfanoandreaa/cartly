/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium"]
  }
};

export default nextConfig;
