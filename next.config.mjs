/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    // Event banners and profile images are uploaded through server actions (3 MB max file).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
