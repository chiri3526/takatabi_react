export const SITE_NAME = 'takatabi';
export const SITE_DESCRIPTION = 'Travel guides, lounge reviews, and trip ideas from takatabi.';
export const SITE_URL = 'https://takatabi.net';

export const CATEGORIES = [
  { key: 'domestic', label: '国内旅行', cmsNames: ['domestic', '国内旅行', 'Domestic Travel'] },
  { key: 'overseas', label: '海外旅行', cmsNames: ['overseas', '海外旅行', 'Overseas Travel'] },
  { key: 'lounge', label: 'ラウンジ', cmsNames: ['lounge', 'ラウンジ', 'Airport Lounges'] },
  { key: 'train', label: '鉄道', cmsNames: ['train', '鉄道', 'Train Travel'] }
];

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function imageUrl(image?: string | { url?: string }) {
  if (!image) return '/contents/photo/kyoto2.jpg';
  if (typeof image === 'string') {
    if (image.startsWith('public/')) return image.replace(/^public/, '');
    return image;
  }
  return image.url || '/contents/photo/kyoto2.jpg';
}

export function formatDate(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function tagLabels(article: {
  tag?: string | { name?: string; id?: string } | Array<string | { name?: string; id?: string }>;
  tags?: Array<string | { name?: string; id?: string }>;
}) {
  const raw = article.tags || article.tag || [];
  const values = Array.isArray(raw) ? raw : [raw];
  return values
    .map(tag => {
      if (!tag) return '';
      if (typeof tag === 'object') return tag.name || tag.id || '';
      return String(tag);
    })
    .filter(Boolean);
}

export function articleHtml(content = '') {
  return content
    .replace(/!\[[^\]]*\]\((?:public)?(\/contents\/[^)]+)\)/g, '<img src="$1" class="cms-image" alt="" />')
    .replace(/<img([^>]*?)src=["']public(\/contents\/[^"']+)["']([^>]*)>/g, '<img$1src="$2"$3>')
    .replace(/<img(?![^>]*class=)([^>]*)>/g, '<img$1 class="cms-image">');
}

export function withToc(content = '') {
  const toc: Array<{ tag: string; id: string; text: string }> = [];
  let index = 0;
  const html = articleHtml(content).replace(/<(h[23])([^>]*)>(.*?)<\/\1>/g, (_match, tag, attrs, text) => {
    const id = `heading-${index++}`;
    const cleanText = stripHtml(text);
    toc.push({ tag, id, text: cleanText });
    return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
  });
  return { toc, html };
}

export function excerptFromArticle(article: { excerpt?: string; content?: string }, fallback = SITE_DESCRIPTION) {
  const source = stripHtml(article.excerpt || article.content || '') || fallback;
  return source.length > 155 ? `${source.slice(0, 152)}...` : source;
}

export function articleId(article: { slug?: string; id?: string }) {
  return String(article.slug || article.id || '');
}

export function articlePath(article: { slug?: string; id?: string }) {
  return `/articles/${encodeURIComponent(articleId(article))}/`;
}

export function categoryPath(category: string) {
  return `/categories/${encodeURIComponent(category)}/`;
}

export function categoryName(article: { category?: string | { name?: string; id?: string } }) {
  const category = article.category;
  if (!category) return '';
  if (typeof category === 'object') return category.name || category.id || '';
  return category;
}

export function categoryKeyForArticle(article: { category?: string | { name?: string; id?: string } }) {
  const current = categoryName(article);
  const matched = CATEGORIES.find(category =>
    category.cmsNames.includes(current) || category.key === current
  );
  return matched?.key || current;
}
