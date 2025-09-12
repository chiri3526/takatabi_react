import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import topImage from '../contents/LP/takatabi.png';

const TopImage = styled.div`
  width: 100%;
  height: 400px;
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${theme.spacing.medium};
  margin-top: ${theme.spacing.large};
  padding-bottom: ${theme.spacing.large};
`;

const PageButton = styled.button`
  padding: ${theme.spacing.small} ${theme.spacing.medium};
  background-color: ${props => props.active ? theme.colors.primary : theme.colors.white};
  color: ${props => props.active ? theme.colors.white : theme.colors.primary};
  border: 1px solid ${theme.colors.primary};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.colors.secondary};
    color: ${theme.colors.white};
  }
`;

// サンプルのブログ記事データを更新
const blogPosts = [
  {
    id: 1234,
    title: "京都の隠れた観光スポット",
    excerpt: "古都京都の知られざる名所を巡る旅。地元の人々に愛される場所をご紹介します。",
    image: require('../contents/photo/kyoto.jpg'),
    slug: "1234"
  },
  {
    id: 1235,
    title: "沖縄離島めぐり",
    excerpt: "エメラルドグリーンの海と白い砂浜、のんびりとした島時間を過ごす旅。",
    image: require('../contents/photo/okinawa.jpg'),
    slug: "1235"
  },
  // テスト用に追加の記事データ
  ...Array(18).fill(null).map((_, index) => ({
    id: 1236 + index,
    title: `旅行記事 ${index + 3}`,
    excerpt: "記事の説明文がここに入ります。",
    image: index % 2 === 0 ? require('../contents/photo/kyoto.jpg') : require('../contents/photo/okinawa.jpg'),
    slug: `${1236 + index}`
  }))
];

const POSTS_PER_PAGE = 10;

const HomePage = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const visiblePosts = blogPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <>
      <TopImage />
      <BlogGrid>
        {visiblePosts.map(post => (
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
      <PaginationContainer>
        {currentPage > 1 && (
          <PageButton onClick={() => setCurrentPage(currentPage - 1)}>
            前のページ
          </PageButton>
        )}
        {Array.from({ length: totalPages }, (_, i) => (
          <PageButton
            key={i + 1}
            active={currentPage === i + 1}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </PageButton>
        ))}
        {currentPage < totalPages && (
          <PageButton onClick={() => setCurrentPage(currentPage + 1)}>
            次のページ
          </PageButton>
        )}
      </PaginationContainer>
    </>
  );
};

export default HomePage;
