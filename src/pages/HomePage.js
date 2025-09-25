import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import topImage from '../contents/LP/takatabi.png';
import { FaMapMarkerAlt, FaGlobeAsia, FaCouch, FaTrain } from 'react-icons/fa';
import articleTest from '../articles/test';

const TopImage = styled.div`
  width: 100%;
  height: 180px; // 高さを小さく変更
  background-image: url(${topImage});
  background-size: cover;
  background-position: center;
  margin-bottom: ${theme.spacing.large};
`;

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
  font-size: 1.25rem;
`;

const BlogExcerpt = styled.p`
  color: ${theme.colors.text};
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

// JSONファイルを一括取得
function importAllJson(r) {
  return r.keys().map(key => {
    const data = r(key);
    // idがなければslugやファイル名から補完
    return {
      id: data.id || data.slug || key.replace(/^.*[/]/, '').replace(/\.json$/, ''),
      ...data
    };
  });
}

const jsonArticles = importAllJson(require.context('../articles', false, /\.json$/));

const blogPosts = [
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
    excerpt: "芸術の都パリで���名美術館を巡る旅。ルーブルやオルセーの魅力を紹介。",
    image: require('../contents/photo/kyoto.jpg'),
    slug: "2001",
    category: "overseas"
  },
  {
    id: 3001,
    title: "羽田空港ラウンジ体験��",
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
  },
  articleTest,
  // テスト用に追加の記事データ
  ...Array(18).fill(null).map((_, index) => ({
    id: 1236 + index,
    title: `旅行記事 ${index + 6}`,
    excerpt: "記事の説明文がここに入ります。",
    image: index % 2 === 0 ? require('../contents/photo/kyoto.jpg') : require('../contents/photo/okinawa.jpg'),
    slug: `${1236 + index}`,
    category: ["domestic", "overseas", "lounge", "train"][index % 4]
  })),
  ...jsonArticles,
];

// 4区画レイアウト用のスタイル
const CategorySection = styled.section`
  margin-bottom: ${theme.spacing.xlarge};
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

const HomePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <TopImage />
      {categories.map(cat => (
        <CategorySection key={cat.key}>
          <CategoryHeader>
            <CategoryIcon>{cat.icon}</CategoryIcon>
            <CategoryTitle>{cat.label}</CategoryTitle>
          </CategoryHeader>
          <BlogGrid>
            {blogPosts.filter(post => post.category === cat.key).slice(0, 4).map(post => (
              <Link
                to={`/?p=${post.slug}`}
                key={post.id}
                style={{ textDecoration: 'none' }}
              >
                <BlogCard>
                  <BlogImage
                    src={post.image}
                    alt={post.title}
                    onError={(e) => {
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
        </CategorySection>
      ))}
    </>
  );
};

export default HomePage;
