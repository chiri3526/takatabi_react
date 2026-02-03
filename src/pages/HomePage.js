import takatabi1 from '../contents/LP/takatabi1.png';
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { fetchArticles, fetchRecommendedArticles } from '../api/microcms';

import { FaMapMarkerAlt, FaGlobeAsia, FaCouch, FaTrain, FaStar } from 'react-icons/fa';

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

// 追加: 日付表示用スタイル
const DateText = styled.div`
  color: ${theme.colors.text}99;
  font-size: 0.85rem;
  margin-bottom: 0.4em;
`;

// タグ用バッジ（日付の上に表示）
const TagBadge = styled.span`
  display: inline-block;
  background: ${theme.colors.primary}11;
  color: ${theme.colors.primary};
  font-size: 0.75rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  margin-bottom: 0.35em;
`;

// ローカルのJSON記事は現在トップ表示に使用していないため除外しています。
// 必要ならここにローカル記事を追加してください。

// 日付を日本語表記で整形するユーティリティ
function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch (e) {
    return '';
  }
}

const categories = [
  { key: 'domestic', label: '国内旅行', cmsName: '国内旅行', icon: <FaMapMarkerAlt /> },
  { key: 'overseas', label: '海外旅行', cmsName: '海外旅行', icon: <FaGlobeAsia /> },
  { key: 'lounge', label: 'ラウンジ', cmsName: 'ラウンジ', icon: <FaCouch /> },
  { key: 'train', label: '鉄道', cmsName: '鉄道', icon: <FaTrain /> }
];

// おすすめ記事用のスタイル
const RecommendedSection = styled.section`
  margin-bottom: ${theme.spacing.xlarge};
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: ${theme.spacing.large};
  border-radius: 12px;
`;

const RecommendedBadge = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #8b5a00;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  margin-bottom: 0.5em;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
`;

// トップページで表示する記事の最大総数（変更可能）
const MAX_TOP_ARTICLES = 16;

const HomePage = () => {
  const [cmsArticles, setCmsArticles] = useState([]);
  const [recommendedArticles, setRecommendedArticles] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    // microCMSから記事取得
    fetchArticles().then(data => {
      if (data && data.contents) {
        setCmsArticles(data.contents);
      }
    });
    
    // おすすめ記事を取得
    fetchRecommendedArticles().then(data => {
      if (data && data.contents) {
        setRecommendedArticles(data.contents);
      }
    });
  }, []);

  // 各カテゴリごとの表示件数を自動計算（総数 = MAX_TOP_ARTICLES）
  const perCategoryLimit = Math.ceil(MAX_TOP_ARTICLES / categories.length);

  // おすすめ記事を表示するコンポーネント
  const renderRecommendedArticles = () => {
    if (recommendedArticles.length === 0) return null;

    return (
      <RecommendedSection>
        <CategoryHeader>
          <CategoryIcon><FaStar /></CategoryIcon>
          <CategoryTitle>おすすめ記事</CategoryTitle>
        </CategoryHeader>
        <BlogGrid>
          {recommendedArticles.map(post => {
            // タグを複数扱えるように配列に正規化
            const tagField = post.tag || post.tags || null;
            let tagLabels = [];
            if (Array.isArray(tagField) && tagField.length > 0) {
              tagLabels = tagField
                .map(t => (t && typeof t === 'object') ? (t.name || t.id || '') : String(t))
                .filter(Boolean);
            } else if (typeof tagField === 'string') {
              tagLabels = [tagField];
            } else if (tagField && typeof tagField === 'object') {
              const label = tagField.name || tagField.id || '';
              if (label) tagLabels = [label];
            }

            return (
              <Link
                to={`/?p=${post.slug || post.id}`}
                key={post.id}
                style={{ textDecoration: 'none' }}
              >
                <BlogCard>
                  <BlogImage
                    src={post.image?.url || post.image}
                    alt={post.title}
                    onError={(e) => { e.target.src = '/sample-images/no-image.jpg'; }}
                  />
                  <BlogContent>
                    {/* おすすめバッジ */}
                    <RecommendedBadge>⭐ おすすめ</RecommendedBadge>
                    {/* タグ表示（複数あればすべて表示） */}
                    {tagLabels.length > 0 && tagLabels.map((lbl, idx) => (
                      <TagBadge key={`${lbl}-${idx}`}>{lbl}</TagBadge>
                    ))}
                    {/* 作成日 */}
                    <DateText>{formatDate(post.publishedAt || post.createdAt || post.updatedAt)}</DateText>
                    <BlogTitle>{post.title}</BlogTitle>
                    <BlogExcerpt>{post.excerpt}</BlogExcerpt>
                  </BlogContent>
                </BlogCard>
              </Link>
            );
          })}
        </BlogGrid>
      </RecommendedSection>
    );
  };

  // microCMS記事のみ表示
  return (
    <>
      <TopLogo>
        <img src={takatabi1} alt="takatabi" style={{width:'50%', height:'70px', borderRadius:'0'}} />
      </TopLogo>
      
      {/* おすすめ記事セクション */}
      {renderRecommendedArticles()}
      
      {categories.map(cat => {
        // microCMS記事のみ抽出
        const cmsForCat = cmsArticles.filter(post => {
          if (post.category && typeof post.category === 'object') {
            return post.category.name === cat.cmsName;
          }
          return post.category === cat.key;
        });
  const postsToShow = cmsForCat.slice(0, perCategoryLimit);
        return (
          <CategorySection key={cat.key}>
            <CategoryHeader>
              <CategoryIcon>{cat.icon}</CategoryIcon>
              <CategoryTitle>{cat.label}</CategoryTitle>
            </CategoryHeader>
            <BlogGrid>
              {postsToShow.map(post => {
                // タグを複数扱えるように配列に正規化
                const tagField = post.tag || post.tags || null;
                let tagLabels = [];
                if (Array.isArray(tagField) && tagField.length > 0) {
                  tagLabels = tagField
                    .map(t => (t && typeof t === 'object') ? (t.name || t.id || '') : String(t))
                    .filter(Boolean);
                } else if (typeof tagField === 'string') {
                  tagLabels = [tagField];
                } else if (tagField && typeof tagField === 'object') {
                  const label = tagField.name || tagField.id || '';
                  if (label) tagLabels = [label];
                }

                return (
                  <Link
                    to={`/?p=${post.slug || post.id}`}
                    key={post.id}
                    style={{ textDecoration: 'none' }}
                  >
                    <BlogCard>
                      <BlogImage
                        src={post.image?.url || post.image}
                        alt={post.title}
                        onError={(e) => { e.target.src = '/sample-images/no-image.jpg'; }}
                      />
                      <BlogContent>
                        {/* タグ表示（複数あればすべて表示） */}
                        {tagLabels.length > 0 && tagLabels.map((lbl, idx) => (
                          <TagBadge key={`${lbl}-${idx}`}>{lbl}</TagBadge>
                        ))}
                        {/* 作成日 */}
                        <DateText>{formatDate(post.publishedAt || post.createdAt || post.updatedAt)}</DateText>
                        <BlogTitle>{post.title}</BlogTitle>
                        <BlogExcerpt>{post.excerpt}</BlogExcerpt>
                      </BlogContent>
                    </BlogCard>
                  </Link>
                );
              })}
            </BlogGrid>
          </CategorySection>
        );
      })}
    </>
  );
};

export default HomePage;
