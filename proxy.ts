import { NextRequest, NextResponse } from 'next/server'
import { contentSecurityPolicy } from './lib/security-headers.mjs'

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV === 'development')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', policy)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', policy)
  // Nonces are generated per request and must never be stored in shared caches.
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const config = { matcher: ['/((?!api|_next|favicon.ico|icon.png|apple-icon.png|branding|images|robots.txt|sitemap.xml).*)'] }
