import axios from "axios";

const SERVICE_DOMAIN = "chiri3526";
const API_KEY = "XORpbhOgeA9qtFwBytkGmADyVCRakRGwtAnE";

export const fetchArticles = async () => {
  const res = await axios.get(
    `https://${SERVICE_DOMAIN}.microcms.io/api/v1/articles`,
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

