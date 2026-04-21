import sanitizeHtml from 'sanitize-html';

const SAFE_CLASSES = {
  img: ['cms-image'],
  code: [/^language-[a-z0-9_-]+$/i],
  pre: [/^language-[a-z0-9_-]+$/i]
};

export function sanitizeArticleHtml(html = '') {
  return sanitizeHtml(html, {
    allowedTags: [
      'h2',
      'h3',
      'h4',
      'p',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'b',
      'i',
      'u',
      's',
      'a',
      'img',
      'blockquote',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'code',
      'pre'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'class', 'loading', 'width', 'height'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
      code: ['class'],
      pre: ['class'],
      blockquote: ['class']
    },
    allowedClasses: SAFE_CLASSES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https']
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer'
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          class: attribs.class?.split(/\s+/).includes('cms-image') ? attribs.class : `${attribs.class || ''} cms-image`.trim(),
          loading: attribs.loading || 'lazy'
        }
      })
    }
  });
}
