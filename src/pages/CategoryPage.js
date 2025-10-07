import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { FaMapMarkerAlt, FaGlobeAsia, FaCouch, FaTrain } from 'react-icons/fa';
import { fetchArticles } from '../api/microcms';

const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.large};
  padding: ${theme.spacing.medium};
`;
const BlogCard = styled.article`
  background: ${theme.colors.white};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-5px);
  }
`;
const BlogImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;
const BlogContent = styled.div`
  padding: ${theme.spacing.medium};
`;
const BlogTitle = styled.h2`
  color: ${theme.colors.text};
  margin: 0 0 ${theme.spacing.small};
  font-size: 1rem;
`;
const BlogExcerpt = styled.p`
  color: ${theme.colors.text};
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;
const CategoryHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${theme.spacing.medium};
`;
const CategoryIcon = styled.div`
  color: ${theme.colors.primary};
  font-size: 2.5rem;
  margin-bottom: 0.5em;
`;
const CategoryTitle = styled.h2`
  font-family: ${theme.font.family};
  font-weight: ${theme.font.weightBold};
  color: ${theme.colors.primary};
  font-size: 1.5rem;
  margin: 0;
  text-align: center;
`;

const categories = [
  { key: 'domestic', label: '国内旅行', icon: <FaMapMarkerAlt /> },
  { key: 'overseas', label: '海外旅行', icon: <FaGlobeAsia /> },
  { key: 'lounge', label: 'ラウンジ', icon: <FaCouch /> },
  { key: 'train', label: '鉄道', icon: <FaTrain /> }
];

function importAllJson(r) {
  return r.keys().map(key => {
    const data = r(key);
    return {
      id: data.id || data.slug || key.replace(/^.*[/]/, '').replace(/\.json$/, ''),
      ...data
    };
  });
}
const jsonArticles = importAllJson(require.context('../articles', false, /\.json$/));

const blogPosts = [
  ...jsonArticles,
  // 既存のjs記事
  {
    id: 1234,
    title: "京都の隠れた観光スポット",
    excerpt: "古都京都の知られざる名所を巡る旅。地元の人々に愛される場所をご紹介します。",
    image: require('../contents/photo/kyoto.jpg'),
    slug: "1234",
    category: "domestic"
  },
  {
    id: 1235,
    title: "沖縄離島めぐり",
    excerpt: "エメラルドグリーンの海と白い砂浜、のんびりとした島時間を過ごす旅。",
    image: require('../contents/photo/okinawa.jpg'),
    slug: "1235",
    category: "domestic"
  },
  {
    id: 2001,
    title: "パリの美術館巡り",
    excerpt: "芸術の都パリで有名美術館を巡る旅。ルーブルやオルセーの魅力を紹介。",
    image: require('../contents/photo/kyoto.jpg'),
    slug: "2001",
    category: "overseas"
  },
  {
    id: 3001,
    title: "羽田空港ラウンジ体験記",
    excerpt: "羽田空港のラウンジで過ごす快適なひととき。サービスや雰囲気をレポート。",
    image: require('../contents/photo/okinawa.jpg'),
    slug: "3001",
    category: "lounge"
  },
  {
    id: 4001,
    title: "新幹線グリーン車の旅",
    excerpt: "快適な新幹線グリーン車での移動体験。車内サービスや座席の様子を紹介。",
    image: require('../contents/photo/kyoto.jpg'),
    slug: "4001",
    category: "train"
  }
];

const CategoryPage = ({ category }) => {
  const [cmsArticles, setCmsArticles] = useState([]);

  useEffect(() => {
    fetchArticles().then(data => {
      if (data && data.contents) {
        setCmsArticles(data.contents);
      }
    });
  }, []);

  const cat = categories.find(c => c.key === category);
  // microCMS記事とローカル記事を統合
  const posts = [
    ...cmsArticles.filter(post => post.category === category),
    ...blogPosts.filter(post => post.category === category && !cmsArticles.some(cms => cms.id === post.id))
  ];
  return (
    <div>
      <CategoryHeader>
        <CategoryIcon>{cat?.icon}</CategoryIcon>
        <CategoryTitle>{cat?.label || category}</CategoryTitle>
      </CategoryHeader>
      <BlogGrid>
        {posts.map(post => (
          <Link
            to={`/?p=${post.slug || post.id}`}
            key={post.id}
            style={{ textDecoration: 'none' }}
          >
            <BlogCard>
              <BlogImage
                src={post.image}
                alt={post.title}
                onError={e => {
                  e.target.src = '/sample-images/no-image.jpg';
                }}
              />
              <BlogContent>
                <BlogTitle>{post.title}</BlogTitle>
                <BlogExcerpt>{post.excerpt}</BlogExcerpt>
              </BlogContent>
            </BlogCard>
          </Link>
        ))}
      </BlogGrid>
    </div>
  );
};

export default CategoryPage;
