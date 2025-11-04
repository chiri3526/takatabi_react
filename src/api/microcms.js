import axios from "axios";

const SERVICE_DOMAIN = "chiri3526";
const API_KEY = "XORpbhOgeA9qtFwBytkGmADyVCRakRGwtAnE";

// 取得上限（必要に応じて増やしてください。トップ表示が最大16件なので余裕を持って50に設定）
const ARTICLES_FETCH_LIMIT = 50;

export const fetchArticles = async () => {
  const res = await axios.get(
    `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles?limit=${ARTICLES_FETCH_LIMIT}`,
    {
      headers: { "X-API-KEY": API_KEY },
    }
  );
  return res.data;
};

export const fetchArticleById = async (id) => {
  const res = await axios.get(
    `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles/${id}`,
    {
      headers: { "X-API-KEY": API_KEY },
    }
  );
  return res.data;
};

