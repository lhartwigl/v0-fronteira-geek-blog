export function trafficSource(referrer, origin) {
  try {
    const url = new URL(referrer)
    if (!['http:', 'https:'].includes(url.protocol)) return 'Direto / não identificado'
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (host === new URL(origin).hostname.replace(/^www\./, '')) return 'Direto / não identificado'
    if (/^(www\.)?google\.[a-z.]+$/.test(host)) return 'Google'
    if (host === 'bing.com') return 'Bing'
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'Instagram'
    if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'Facebook'
    if (['t.co','x.com','twitter.com'].includes(host)) return 'X / Twitter'
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) return 'YouTube'
    return host.slice(0, 200)
  } catch { return 'Direto / não identificado' }
}
