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
  ...jsonArticles
  // 既存のハードコード記事は削除しました。必要ならここに追加してください。
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
        {posts.map(post => (
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
                <BlogTitle>{post.title}</BlogTitle>
                <BlogExcerpt>{post.excerpt}</BlogExcerpt>
              </BlogContent>
            </BlogCard>
          </Link>
        ))}
      </BlogGrid>
      <BackLink to="/">
        トップページへ戻る
      </BackLink>
    </div>
  );
};

export default CategoryPage;
