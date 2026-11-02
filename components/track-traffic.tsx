"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function TrackTraffic() {
  const pathname = usePathname()
  useEffect(() => {
    let referrer = ''
    try { referrer = new URL(document.referrer).origin } catch {}
    try {
      const previous = JSON.parse(sessionStorage.getItem('fg-traffic-entry') || 'null')
      const now = Date.now()
      if (previous && now - previous.at < 30 * 60 * 1000) referrer = previous.referrer
      sessionStorage.setItem('fg-traffic-entry', JSON.stringify({ referrer, at: now }))
    } catch {}
    // Deferred so React's development effect replay does not count twice.
    const timer = setTimeout(() => {
      fetch('/api/traffic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referrer }), keepalive: true }).catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [pathname])
  return null
}
