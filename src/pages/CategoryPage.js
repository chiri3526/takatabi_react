import React, { useEffect, useState } from 'react';
import takatabi1 from '../contents/LP/takatabi1.png';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { FaMapMarkerAlt, FaGlobeAsia, FaCouch, FaTrain } from 'react-icons/fa';
import { fetchArticles } from '../api/microcms';

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  /* 上は元の余白を保持し、左と下に余白を追加 */
  margin: ${theme.spacing.large} 0 ${theme.spacing.large} ${theme.spacing.medium};
  color: ${theme.colors.primary};
  text-decoration: none;
  font-weight: bold;
  font-size: 1.05rem;
  background: #f6fff6;
  border-radius: 6px;
  padding: 0.5em 1.2em;
  box-shadow: 0 2px 8px rgba(0,128,64,0.07);
  border: 1.5px solid ${theme.colors.primary}33;
  transition: background 0.2s, color 0.2s, border 0.2s;
  &:hover {
    background: ${theme.colors.primary};
    color: #fff;
    border-color: ${theme.colors.primary};
  }
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
  font-size: 1rem;
`;
const BlogExcerpt = styled.p`
  color: ${theme.colors.text};
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

// 日付表示用スタイル（HomePage と合わせる）
const DateText = styled.div`
  color: ${theme.colors.text}99;
  font-size: 0.85rem;
  margin-bottom: 0.4em;
`;

// タグ用バッジ
const TagBadge = styled.span`
  display: inline-block;
  background: ${theme.colors.primary}11;
  color: ${theme.colors.primary};
  font-size: 0.75rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  margin-bottom: 0.35em;
  margin-right: 0.35rem;
`;

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


const categories = [
  { key: 'domestic', label: '国内旅行', cmsName: '国内旅行', icon: <FaMapMarkerAlt /> },
  { key: 'overseas', label: '海外旅行', cmsName: '海外旅行', icon: <FaGlobeAsia /> },
  { key: 'lounge', label: 'ラウンジ', cmsName: 'ラウンジ', icon: <FaCouch /> },
  { key: 'train', label: '鉄道', cmsName: '鉄道', icon: <FaTrain /> }
];


const CategoryPage = ({ category }) => {
  const [cmsArticles, setCmsArticles] = useState([]);

  useEffect(() => {
    fetchArticles().then(data => {
      if (data && data.contents) {
        setCmsArticles(data.contents);
      }
    });
  }, [category]);

  const cat = categories.find(c => c.key === category);
  // microCMS記事のみ表示
  const posts = cmsArticles.filter(post => {
    if (post.category && typeof post.category === 'object') {
      return post.category.name === cat.cmsName;
    }
    return post.category === category;
  });
  return (
    <div>
      <TopLogo>
        <img src={takatabi1} alt="takatabi" style={{width:'50%', height:'70px', borderRadius:'0'}} />
      </TopLogo>
      <BlogGrid>
        {posts.map(post => {
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
                  src={
                    post.image
                      ? typeof post.image === 'string'
                        ? post.image.startsWith('/')
                          ? post.image
                          : `/${post.image}`
                        : post.image.url // microCMS形式
                      : '/sample-images/no-image.jpg'
                  }
                  alt={post.title}
                  onError={(e) => {
                    e.target.src = '/sample-images/no-image.jpg';
                  }}
                />
                <BlogContent>
                  {/* タグ表示（複数ならすべて表示） */}
                  {tagLabels.length > 0 && tagLabels.map((lbl, idx) => (
                    <TagBadge key={`${lbl}-${idx}`}>{lbl}</TagBadge>
                  ))}
                  {/* 公開日表示 */}
                  <DateText>{formatDate(post.publishedAt || post.createdAt || post.updatedAt)}</DateText>
                  <BlogTitle>{post.title}</BlogTitle>
                  <BlogExcerpt>{post.excerpt}</BlogExcerpt>
                </BlogContent>
              </BlogCard>
            </Link>
          );
        })}
      </BlogGrid>
      <BackLink to="/">
        トップページへ戻る
      </BackLink>
    </div>
  );
};

export default CategoryPage;
