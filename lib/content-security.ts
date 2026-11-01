import sanitizeHtml from 'sanitize-html'

export function cleanContent(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'iframe', 'u', 's'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['style'], a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'title'],
      iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
    },
    allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
    allowedSchemes: ['https', 'http', 'mailto'], allowProtocolRelative: false,
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true) },
  })
}
