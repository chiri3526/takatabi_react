import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { fetchArticles, fetchRecommendedArticles } from '../api/microcms';
import heroImage from '../contents/photo/kyoto.jpg';

import {
  FaArrowRight,
  FaChevronRight,
  FaCouch,
  FaEnvelope,
  FaGlobeAsia,
  FaMapMarkerAlt,
  FaPlay,
  FaStar,
  FaTrain
} from 'react-icons/fa';

const PageShell = styled.div`
  background: linear-gradient(180deg, #f3f8f3 0%, #edf6ed 100%);
  padding-bottom: 56px;
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
  color: ${theme.colors.text};
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

const HeroSection = styled.section`
  margin: 0 auto;
  width: min(100%, 1280px);
  min-height: 420px;
  border-radius: 0;
  background-image: linear-gradient(180deg, rgba(17, 40, 17, 0.38), rgba(17, 40, 17, 0.55)), url(${heroImage});
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  padding: 48px 16px;

  @media (min-width: 1024px) {
    min-height: 520px;
  }
`;

const HeroInner = styled.div`
  max-width: 760px;
`;

const HeroEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #3ad25a;
  color: #09340f;
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  font-weight: 700;
  padding: 0.33rem 0.72rem;
  margin-bottom: 14px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 4rem);
  line-height: 1.03;
`;

const HeroHighlight = styled.span`
  color: #3ad25a;
`;

const HeroLead = styled.p`
  margin: 18px auto 0;
  max-width: 620px;
  font-size: clamp(0.96rem, 1.35vw, 1.15rem);
  line-height: 1.7;
`;

const HeroActions = styled.div`
  margin-top: 28px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const HeroPrimary = styled.button`
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #42d261 0%, #2e7d32 100%);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.72rem 1.3rem;
  cursor: pointer;
`;

const HeroGhost = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.72rem 1.3rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const MainWrap = styled.main`
  width: min(1160px, 94vw);
  margin: 38px auto 0;
`;

const SectionBlock = styled.section`
  background: #f7faf7;
  border-radius: 16px;
  border: 1px solid ${theme.colors.primary}15;
  padding: 22px 20px;
  margin-bottom: 28px;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 2rem;
  color: #121212;
  line-height: 1.1;
`;

const SectionSub = styled.p`
  margin: 6px 0 0;
  color: ${theme.colors.text}aa;
  font-size: 0.9rem;
`;

const ViewAll = styled(Link)`
  color: ${theme.colors.primary};
  text-decoration: none;
  font-weight: 700;
  font-size: 0.86rem;
  white-space: nowrap;
`;

const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.large};
  padding: ${theme.spacing.medium};
`;

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

const DateText = styled.div`
  color: ${theme.colors.text}99;
  font-size: 0.85rem;
  margin-bottom: 0.4em;
`;

const TagBadge = styled.span`
  display: inline-block;
  background: ${theme.colors.primary}11;
  color: ${theme.colors.primary};
  font-size: 0.75rem;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  margin-bottom: 0.35em;
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

const SplitRow = styled.section`
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 18px;
  margin-bottom: 30px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LatestCard = styled(Link)`
  display: block;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  min-height: 340px;
  background: #123;
  text-decoration: none;
  color: #fff;
`;

const LatestImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
`;

const LatestOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 17, 7, 0.1), rgba(5, 17, 7, 0.72));
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const LatestTag = styled.span`
  display: inline-block;
  border-radius: 999px;
  background: #2fd953;
  color: #08310d;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.18rem 0.5rem;
  margin-bottom: 8px;
`;

const LatestTitle = styled.h3`
  margin: 0;
  font-size: clamp(1.45rem, 2.2vw, 2.15rem);
  line-height: 1.2;
`;

const LatestExcerpt = styled.p`
  margin: 10px 0 0;
  line-height: 1.6;
  font-size: 0.92rem;
`;

const LatestButton = styled.span`
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: linear-gradient(135deg, #42d261 0%, #2e7d32 100%);
  border-radius: 999px;
  color: #fff;
  width: fit-content;
  padding: 0.42rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 700;
`;

const TrendingPanel = styled.aside`
  background: #f7faf7;
  border: 1px solid ${theme.colors.primary}1f;
  border-radius: 14px;
  padding: 16px;
`;

const TrendingTitle = styled.h3`
  margin: 0 0 14px;
  color: #121212;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const TrendingList = styled.div`
  display: grid;
  gap: 12px;
`;

const TrendingItem = styled(Link)`
  display: grid;
  grid-template-columns: 66px 1fr;
  gap: 10px;
  text-decoration: none;
`;

const TrendingThumb = styled.img`
  width: 66px;
  height: 66px;
  object-fit: cover;
  border-radius: 8px;
`;

const TrendingMeta = styled.div`
  min-width: 0;

  p {
    margin: 0;
    color: ${theme.colors.primary};
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 700;
  }

  h4 {
    margin: 0.25rem 0 0;
    color: #1d1d1d;
    font-size: 0.9rem;
    line-height: 1.35;
  }
`;

const Newsletter = styled.section`
  margin: 42px auto 0;
  width: min(840px, 92vw);
  border-radius: 14px;
  background: linear-gradient(120deg, #0f3d17 0%, #1f6f2f 100%);
  color: #fff;
  padding: 34px 18px;
  text-align: center;
  box-shadow: 0 15px 34px rgba(16, 70, 28, 0.22);
`;

const NewsletterIcon = styled.div`
  font-size: 1.35rem;
  color: #4be069;
`;

const NewsletterTitle = styled.h3`
  margin: 8px 0 0;
  font-size: clamp(1.4rem, 2.1vw, 2.1rem);
`;

const NewsletterLead = styled.p`
  margin: 8px auto 0;
  max-width: 560px;
  line-height: 1.7;
  color: #ffffffd8;
`;

const NewsletterForm = styled.div`
  margin: 18px auto 0;
  max-width: 560px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;

  input {
    border-radius: 8px;
    border: 1px solid #ffffff40;
    background: #ffffff14;
    color: #fff;
    padding: 0.72rem 0.8rem;
    outline: none;
  }

  input::placeholder {
    color: #ffffffaa;
  }

  button {
    border: none;
    border-radius: 8px;
    background: #48db66;
    color: #09380f;
    font-weight: 700;
    padding: 0.72rem 1.1rem;
    cursor: pointer;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

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

const MAX_TOP_ARTICLES = 16;

const HomePage = () => {
  const [cmsArticles, setCmsArticles] = useState([]);
  const [recommendedArticles, setRecommendedArticles] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchArticles().then(data => {
      if (data && data.contents) {
        setCmsArticles(data.contents);
      }
    });

    fetchRecommendedArticles().then(data => {
      if (data && data.contents) {
        setRecommendedArticles(data.contents);
      }
    });
  }, []);

  const perCategoryLimit = Math.ceil(MAX_TOP_ARTICLES / categories.length);

  const latestFeature = useMemo(() => cmsArticles[0] || recommendedArticles[0] || null, [cmsArticles, recommendedArticles]);
  const trendingPosts = useMemo(() => {
    const source = cmsArticles.length > 1 ? cmsArticles.slice(1) : recommendedArticles;
    return source.slice(0, 3);
  }, [cmsArticles, recommendedArticles]);

  const renderRecommendedArticles = () => {
    if (recommendedArticles.length === 0) return null;

    return (
      <SectionBlock>
        <SectionHead>
          <div>
            <SectionTitle>Featured Stories</SectionTitle>
            <SectionSub>編集部おすすめの人気記事をピックアップ</SectionSub>
          </div>
          <ViewAll to="/?category=overseas">View All Posts <FaChevronRight /></ViewAll>
        </SectionHead>
        <BlogGrid>
          {recommendedArticles.map(post => {
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
                    <RecommendedBadge>⭐ おすすめ</RecommendedBadge>
                    {tagLabels.length > 0 && tagLabels.map((lbl, idx) => (
                      <TagBadge key={`${lbl}-${idx}`}>{lbl}</TagBadge>
                    ))}
                    <DateText>{formatDate(post.publishedAt || post.createdAt || post.updatedAt)}</DateText>
                    <BlogTitle>{post.title}</BlogTitle>
                    <BlogExcerpt>{post.excerpt}</BlogExcerpt>
                  </BlogContent>
                </BlogCard>
              </Link>
            );
          })}
        </BlogGrid>
      </SectionBlock>
    );
  };

  return (
    <PageShell>
      <TopNav>
        <BrandHeader>
          <BrandIcon><FaGlobeAsia /></BrandIcon>
          <BrandText>takatabi</BrandText>
        </BrandHeader>
        <NavLinks>
          <NavItem to="/?category=domestic">国内旅行</NavItem>
          <NavItem to="/?category=overseas">海外旅行</NavItem>
          <NavItem to="/?category=lounge">ラウンジ</NavItem>
          <NavItem to="/?category=train">鉄道</NavItem>
        </NavLinks>
        <SubscribeButton>Subscribe</SubscribeButton>
      </TopNav>

      <HeroSection>
        <HeroInner>
          <HeroEyebrow>DISCOVER NATURE</HeroEyebrow>
          <HeroTitle>
            Explore the Wild <br />
            <HeroHighlight>Unknown</HeroHighlight>
          </HeroTitle>
          <HeroLead>
            サステナブルな旅ガイド、ホテル情報、体験記まで。次の旅のヒントをここで見つけよう。
          </HeroLead>
          <HeroActions>
            <HeroPrimary>Start Reading <FaArrowRight /></HeroPrimary>
            <HeroGhost><FaPlay /> Watch Video</HeroGhost>
          </HeroActions>
        </HeroInner>
      </HeroSection>

      <MainWrap>
        {renderRecommendedArticles()}

        {latestFeature && (
          <SplitRow>
            <LatestCard to={`/?p=${latestFeature.slug || latestFeature.id}`}>
              <LatestImage src={latestFeature.image?.url || latestFeature.image} alt={latestFeature.title} />
              <LatestOverlay>
                <LatestTag>ROAD TRIP</LatestTag>
                <LatestTitle>{latestFeature.title}</LatestTitle>
                <LatestExcerpt>{latestFeature.excerpt || '新着記事のハイライトをご覧ください。'}</LatestExcerpt>
                <LatestButton>Read Article</LatestButton>
              </LatestOverlay>
            </LatestCard>

            <TrendingPanel>
              <TrendingTitle><FaStar /> Trending Now</TrendingTitle>
              <TrendingList>
                {trendingPosts.map(item => (
                  <TrendingItem to={`/?p=${item.slug || item.id}`} key={item.id || item.slug}>
                    <TrendingThumb src={item.image?.url || item.image} alt={item.title} />
                    <TrendingMeta>
                      <p>{typeof item.category === 'object' ? item.category?.name : item.category || 'guide'}</p>
                      <h4>{item.title}</h4>
                    </TrendingMeta>
                  </TrendingItem>
                ))}
              </TrendingList>
            </TrendingPanel>
          </SplitRow>
        )}

        {categories.map(cat => {
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
                          {tagLabels.length > 0 && tagLabels.map((lbl, idx) => (
                            <TagBadge key={`${lbl}-${idx}`}>{lbl}</TagBadge>
                          ))}
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

        <Newsletter>
          <NewsletterIcon><FaEnvelope /></NewsletterIcon>
          <NewsletterTitle>Join the Adventure</NewsletterTitle>
          <NewsletterLead>
            旅の最新情報、ラウンジレビュー、節約術をメールでお届けします。
          </NewsletterLead>
          <NewsletterForm>
            <input type="email" placeholder="Enter your email address" />
            <button type="button">Subscribe</button>
          </NewsletterForm>
        </Newsletter>
      </MainWrap>
    </PageShell>
  );
};

export default HomePage;
