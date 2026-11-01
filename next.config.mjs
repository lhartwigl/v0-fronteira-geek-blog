import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { securityHeaders } from './lib/security-headers.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ]
  },
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    dangerouslyAllowLocalIP: false,
    dangerouslyAllowSVG: false,
    maximumRedirects: 0,
    maximumResponseBody: 10 * 1024 * 1024,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mzs6pi58namqatke.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
