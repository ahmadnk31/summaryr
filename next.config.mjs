/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // <CHANGE> Increased body size limit for server actions to handle document uploads
  serverActions: {
    bodySizeLimit: '10mb',
  },
}

export default nextConfig
