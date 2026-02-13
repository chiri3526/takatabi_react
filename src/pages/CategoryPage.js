import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Link, useLocation } from 'react-router-dom';
import { theme } from '../styles/theme';
import { FaMapMarkerAlt, FaGlobeAsia, FaCouch, FaTrain } from 'react-icons/fa';
import { fetchArticles } from '../api/microcms';

const PageShell = styled.div`
  background: linear-gradient(180deg, #f3f8f3 0%, #edf6ed 100%);
  min-height: 100vh;
`;

const TopNav = styled.header`
  background: #ffffff;
  border-bottom: 1px solid ${theme.colors.primary}22;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 20;

  @media (min-width: 1024px) {
    padding: 14px 32px;
  }
`;

const BrandHeader = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
`;

const BrandIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.primary};
  font-size: 1rem;
`;

const BrandText = styled.span`
  color: ${theme.colors.primary};
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const NavLinks = styled.nav`
  display: none;

  @media (min-width: 1024px) {
    display: inline-flex;
    align-items: center;
    gap: 1.4rem;
  }
`;

const NavItem = styled(Link)`
  color: ${props => (props.$active ? theme.colors.primary : theme.colors.text)};
  font-weight: ${props => (props.$active ? 700 : 400)};
  text-decoration: none;
  font-size: 0.9rem;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const SubscribeButton = styled.button`
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #42c95d 0%, #2e7d32 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
`;

const ContentWrap = styled.div`
  width: min(1160px, 94vw);
  margin: 26px auto 0;
`;

const CategoryHero = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0 4px;
`;

const CategoryHeroIcon = styled.div`
  color: ${theme.colors.primary};
  font-size: 2.5rem;
  margin-bottom: 0.5em;
`;

const CategoryHeroTitle = styled.h2`
  font-family: ${theme.font.family};
  font-weight: ${theme.font.weightBold};
  color: ${theme.colors.primary};
  font-size: 1.5rem;
  margin: 0;
  text-align: center;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
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

const PaginationWrap = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 6px 0 18px;
  flex-wrap: wrap;
`;

const PageButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 0.7rem;
  border-radius: 8px;
  border: 1px solid ${props => (props.$active ? theme.colors.primary : `${theme.colors.primary}33`)};
  background: ${props => (props.$active ? theme.colors.primary : '#f6fff6')};
  color: ${props => (props.$active ? '#fff' : theme.colors.primary)};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: ${props => (props.$active ? 700 : 500)};

  &:hover {
    background: ${props => (props.$active ? theme.colors.primary : '#e8f5e9')};
  }
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
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1em * 1.4 * 3);
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

const categories = [
  { key: 'domestic', label: '国内旅行', cmsName: '国内旅行', icon: <FaMapMarkerAlt /> },
  { key: 'overseas', label: '海外旅行', cmsName: '海外旅行', icon: <FaGlobeAsia /> },
  { key: 'lounge', label: 'ラウンジ', cmsName: 'ラウンジ', icon: <FaCouch /> },
  { key: 'train', label: '鉄道', cmsName: '鉄道', icon: <FaTrain /> }
];
const POSTS_PER_PAGE = 12;


const CategoryPage = ({ category }) => {
  const location = useLocation();
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
  const posts = useMemo(() => cmsArticles.filter(post => {
    if (!cat) return false;
    if (post.category && typeof post.category === 'object') {
      return post.category.name === cat.cmsName;
    }
    return post.category === category;
  }), [cmsArticles, category, cat]);

  const pageParam = Number.parseInt(new URLSearchParams(location.search).get('page') || '1', 10);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const currentPage = Number.isFinite(pageParam)
    ? Math.min(Math.max(pageParam, 1), totalPages)
    : 1;
  const pagedPosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const makePageHref = (page) => `/?category=${category}&page=${page}`;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, currentPage]);
  return (
    <PageShell>
      <TopNav>
        <BrandHeader>
          <BrandIcon><FaGlobeAsia /></BrandIcon>
          <BrandText>takatabi</BrandText>
        </BrandHeader>
        <NavLinks>
          <NavItem to="/?category=domestic" $active={category === 'domestic'}>国内旅行</NavItem>
          <NavItem to="/?category=overseas" $active={category === 'overseas'}>海外旅行</NavItem>
          <NavItem to="/?category=lounge" $active={category === 'lounge'}>ラウンジ</NavItem>
          <NavItem to="/?category=train" $active={category === 'train'}>鉄道</NavItem>
        </NavLinks>
        <SubscribeButton>Subscribe</SubscribeButton>
      </TopNav>

      <ContentWrap>
        <CategoryHero>
          <CategoryHeroIcon>{cat?.icon || <FaGlobeAsia />}</CategoryHeroIcon>
          <CategoryHeroTitle>{cat?.label || 'カテゴリ'}</CategoryHeroTitle>
        </CategoryHero>
        <BlogGrid>
          {pagedPosts.map(post => {
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
        {totalPages > 1 && (
          <PaginationWrap aria-label="ページ送り">
            {currentPage > 1 && (
              <PageButton to={makePageHref(currentPage - 1)}>前へ</PageButton>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PageButton
                key={page}
                to={makePageHref(page)}
                $active={page === currentPage}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </PageButton>
            ))}
            {currentPage < totalPages && (
              <PageButton to={makePageHref(currentPage + 1)}>次へ</PageButton>
            )}
          </PaginationWrap>
        )}
        <BackLink to="/">
          トップページへ戻る
        </BackLink>
      </ContentWrap>
    </PageShell>
  );
};

export default CategoryPage;
