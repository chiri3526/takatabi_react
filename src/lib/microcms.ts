import { articleId } from './site';

export type Article = {
  id?: string;
  slug?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  image?: string | { url?: string };
  category?: string | { name?: string; id?: string };
  tag?: string | { name?: string; id?: string } | Array<string | { name?: string; id?: string }>;
  tags?: Array<string | { name?: string; id?: string }>;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  recommend_order?: number;
};

type MicrocmsListResponse = {
  contents?: Article[];
};

const ARTICLES_FETCH_LIMIT = 100;
const localArticleModules = import.meta.glob<Article>('../articles/*.json', {
  eager: true,
  import: 'default'
});

function getEnv(name: string) {
  return import.meta.env[name] || process.env[name];
}

function normalizeArticle(article: Article, fallbackId = ''): Article {
  const id = articleId(article) || fallbackId;
  return {
    id,
    slug: article.slug || id,
    ...article
  };
}

function localArticles() {
  return Object.entries(localArticleModules)
    .map(([path, article]) => {
      const fallbackId = path.split('/').pop()?.replace(/\.json$/, '') || '';
      return normalizeArticle(article, fallbackId);
    })
    .filter(article => articleId(article));
}

async function microcmsFetch<T>(path: string): Promise<T | null> {
  const serviceDomain = getEnv('MICROCMS_SERVICE_DOMAIN');
  const apiKey = getEnv('MICROCMS_API_KEY');
  if (!serviceDomain || !apiKey) return null;

  const url = `https://${serviceDomain}.microcms.io/api/v1/${path}`;
  const response = await fetch(url, {
    headers: { 'X-API-KEY': apiKey }
  });

  if (!response.ok) {
    throw new Error(`microCMS request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getArticles() {
  const remote = await microcmsFetch<MicrocmsListResponse>(`articles?limit=${ARTICLES_FETCH_LIMIT}`);
  const articles = remote?.contents?.length ? remote.contents : localArticles();
  return articles.map((article, index) => normalizeArticle(article, String(index)));
}

export async function getRecommendedArticles() {
  const remote = await microcmsFetch<MicrocmsListResponse>(
    `articles?filters=recommend_order[exists]&orders=recommend_order&limit=${ARTICLES_FETCH_LIMIT}`
  );

  if (remote?.contents?.length) {
    return remote.contents.map((article, index) => normalizeArticle(article, String(index)));
  }

  return (await getArticles()).slice(0, 4);
}

export async function getArticleById(id: string) {
  const remote = await microcmsFetch<Article>(`articles/${encodeURIComponent(id)}`);
  if (remote) return normalizeArticle(remote, id);

  return (await getArticles()).find(article => articleId(article) === String(id)) || null;
}
