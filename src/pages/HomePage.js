import takatabi1 from '../contents/LP/takatabi1.png';
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { fetchArticles } from '../api/microcms';

import { FaMapMarkerAlt, FaGlobeAsia, FaCouch, FaTrain } from 'react-icons/fa';

const TopLogo = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;

  img {
    width: 50%;
    height: 70px;
    border-radius: 0;
    object-fit: contain;
    margin: 0 auto;
    display: block;
  }
`;

const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.large};
  padding: ${theme.spacing.medium};
`;

// 4区画レイアウト用のスタイル（欠如していた定義を追加）
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
  font-size: 1rem; // 小さめに変更
`;

const BlogExcerpt = styled.p`
  color: ${theme.colors.text};
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

// ローカルのJSON記事は現在トップ表示に使用していないため除外しています。
// 必要ならここにローカル記事を追加してください。

const categories = [
  { key: 'domestic', label: '国内旅行', cmsName: '国内旅行', icon: <FaMapMarkerAlt /> },
  { key: 'overseas', label: '海外旅行', cmsName: '海外旅行', icon: <FaGlobeAsia /> },
  { key: 'lounge', label: 'ラウンジ', cmsName: 'ラウンジ', icon: <FaCouch /> },
  { key: 'train', label: '鉄道', cmsName: '鉄道', icon: <FaTrain /> }
];

const HomePage = () => {
  const [cmsArticles, setCmsArticles] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    // microCMSから記事取得
    fetchArticles().then(data => {
      if (data && data.contents) {
        setCmsArticles(data.contents);
      }
    });
  }, []);

  // microCMS記事のみ表示
  return (
    <>
      <TopLogo>
        <img src={takatabi1} alt="takatabi" style={{width:'50%', height:'70px', borderRadius:'0'}} />
      </TopLogo>
      {categories.map(cat => {
        // microCMS記事のみ抽出
        const cmsForCat = cmsArticles.filter(post => {
          if (post.category && typeof post.category === 'object') {
            return post.category.name === cat.cmsName;
          }
          return post.category === cat.key;
        });
        const postsToShow = cmsForCat.slice(0, 4);
        return (
          <CategorySection key={cat.key}>
            <CategoryHeader>
              <CategoryIcon>{cat.icon}</CategoryIcon>
              <CategoryTitle>{cat.label}</CategoryTitle>
            </CategoryHeader>
            <BlogGrid>
              {postsToShow.map(post => (
                <Link
                  to={`/?p=${post.slug || post.id}`}
                  key={post.id}
                  style={{ textDecoration: 'none' }}
                >
                  <BlogCard>
                    <BlogImage
                      src={post.image?.url || post.image}
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
        );
      })}
    </>
  );
};

export default HomePage;
