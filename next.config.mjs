/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude ws from bundling for Neon WebSocket support in local dev
  serverExternalPackages: ['ws'],
}

export default nextConfig