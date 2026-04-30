import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://127.0.0.1:8009'}/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://127.0.0.1:8009'}/socket.io/:path*`,
      },
    ]
  },
}

export default nextConfig
