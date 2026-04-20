import axios from "axios";

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN || process.env.REACT_APP_MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY || process.env.REACT_APP_MICROCMS_API_KEY;

// 取得上限（必要に応じて増やしてください。トップ表示が最大16件なので余裕を持って50に設定）
const ARTICLES_FETCH_LIMIT = 50;

export const fetchArticles = async () => {
  if (!SERVICE_DOMAIN || !API_KEY) return { contents: [] };
  const res = await axios.get(
    `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles?limit=${ARTICLES_FETCH_LIMIT}`,
    {
      headers: { "X-API-KEY": API_KEY },
    }
  );
  return res.data;
};

// おすすめ記事を取得する関数を追加
export const fetchRecommendedArticles = async () => {
  if (!SERVICE_DOMAIN || !API_KEY) return { contents: [] };
  const res = await axios.get(
    `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles?filters=recommend_order[exists]&orders=recommend_order&limit=${ARTICLES_FETCH_LIMIT}`,
    {
      headers: { "X-API-KEY": API_KEY },
    }
  );
  return res.data;
};

export const fetchArticleById = async (id) => {
  if (!SERVICE_DOMAIN || !API_KEY) return null;
  const res = await axios.get(
    `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles/${id}`,
    {
      headers: { "X-API-KEY": API_KEY },
    }
  );
  return res.data;
};

