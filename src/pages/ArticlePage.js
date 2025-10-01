import React, { useEffect, useRef } from 'react';
// Google AdSense scriptをheadに挿入（重複防止）
function useAdsenseScript() {
  useEffect(() => {
    if (!document.querySelector('script[src*="adsbygoogle.js?client=ca-pub-7728107798566122"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7728107798566122';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, []);
}
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { FaLink, FaArrowLeft } from 'react-icons/fa';

// 記事データを個別ファイルからimport
import article1234 from '../articles/1234';
import article1235 from '../articles/1235';
import articleTest from '../articles/test';
import topImage from '../contents/LP/takatabi.png';

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
  ...jsonArticles,
  article1234,
  article1235,
  articleTest
];

const ArticleContainer = styled.div`
  max-width: 700px;
  margin: 40px auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: ${theme.spacing.xlarge};
`;
const ArticleTitle = styled.h1`
  font-size: 1.2rem; // 小さめに変更
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.medium};
`;
const ArticleImageEyeCatch = styled.img`
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.13);
  background: #fff;
  margin-bottom: 1.5em;
`;
const ArticleContent = styled.div`
  color: ${theme.colors.text};
  font-size: 1.1rem;
  line-height: 1.8;
  font-family: 'Rounded Mplus 1c', 'Noto Sans JP', 'Meiryo', 'Hiragino Maru Gothic Pro', Arial, sans-serif;

  h2 {
    color: ${theme.colors.primary};
    font-size: 1.5rem;
    border-left: 7px solid ${theme.colors.primary};
    border-radius: 0 12px 12px 0;
    padding-left: 0.7em;
    margin: 2em 0 1em 0;
    font-weight: bold;
    background: #f6fff6;
    font-family: 'Rounded Mplus 1c', 'Noto Sans JP', 'Meiryo', 'Hiragino Maru Gothic Pro', Arial, sans-serif;
  }
  h3 {
    color: ${theme.colors.secondary};
    font-size: 1.2rem;
    margin: 1.5em 0 0.7em 0;
    font-weight: bold;
    border-left: 5px solid ${theme.colors.secondary};
    border-radius: 0 10px 10px 0;
    padding-left: 0.6em;
    background: #eaffea;
    font-family: 'Rounded Mplus 1c', 'Noto Sans JP', 'Meiryo', 'Hiragino Maru Gothic Pro', Arial, sans-serif;
  }
  h4 {
    color: ${theme.colors.accent};
    font-size: 1.05rem;
    margin: 1.2em 0 0.5em 0;
    font-weight: bold;
    border-left: 4px dashed ${theme.colors.accent};
    border-radius: 0 8px 8px 0;
    padding-left: 0.5em;
    background: #f9fff6;
    font-family: 'Rounded Mplus 1c', 'Noto Sans JP', 'Meiryo', 'Hiragino Maru Gothic Pro', Arial, sans-serif;
  }
  strong, .em {
    color: ${theme.colors.highlight};
    background: #fffbe6;
    font-weight: bold;
    padding: 0 0.2em;
    border-radius: 4px;
  }
`;
const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  margin-top: ${theme.spacing.large};
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
const EyeCatch = styled.div`
  width: 100%;
  height: 180px;
  background-image: url(${topImage});
  background-size: cover;
  background-position: center;
  margin-bottom: ${theme.spacing.large};
  display: flex;
  align-items: center;
  justify-content: center;
`;
// 関連記事リスト
const RelatedSection = styled.div`
  margin-top: 48px;
  text-align: center;
`;
const RelatedTitle = styled.h3`
  color: ${theme.colors.primary};
  font-size: 1.3rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  margin-bottom: 1.5em;
`;
const RelatedList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2em;
`;
const RelatedCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 180px;
  background: #f6fff6;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  text-decoration: none;
  transition: box-shadow 0.2s;
  border: 2px solid ${theme.colors.primary}22;
  padding: 1em 0.5em 1.2em 0.5em;
  &:hover {
    box-shadow: 0 4px 16px rgba(0,128,64,0.13);
    border-color: ${theme.colors.primary};
  }
`;
const RelatedImage = styled.img`
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 18px;
  margin-bottom: 0.7em;
`;
const RelatedCardTitle = styled.div`
  color: ${theme.colors.primary};
  font-weight: bold;
  font-size: 1.05rem;
  text-align: center;
  margin-top: 0.2em;
`;

const ArticlePage = (props) => {
  useAdsenseScript();
  const adRef = useRef(null);
  const id = props.id;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  // AdSense広告の初期化
  useEffect(() => {
    if (window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {}
    }
  }, [id]);
  const post = blogPosts.find(p => p.slug === id);
  // 関連記事（同じカテゴリで自分以外）
  const related = blogPosts.filter(p => p.category === post?.category && p.slug !== id);

  if (!post) {
    return <ArticleContainer>記事が見つかりませんでした。</ArticleContainer>;
  }

  return (
    <>
      <EyeCatch />
      <ArticleContainer>
        <ArticleTitle>{post.title}</ArticleTitle>
        <div style={{display:'flex', justifyContent:'center'}}>
          <ArticleImageEyeCatch src={post.image} alt={post.title} />
        </div>
        <ArticleContent dangerouslySetInnerHTML={{ __html: post.content }} />
        {/* Google AdSense in-article広告ユニット */}
        <div style={{margin: '32px 0', display: 'flex', justifyContent: 'center'}}>
          <ins className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client="ca-pub-7728107798566122"
            data-ad-slot="5951785085"
            ref={adRef}
          ></ins>
        </div>
        {related.length > 0 && (
          <RelatedSection>
            <RelatedTitle><FaLink /> 関連ページ</RelatedTitle>
            <RelatedList>
              {related.map(r => (
                <RelatedCard to={`/?p=${r.slug}`} key={r.slug}>
                  <RelatedImage style={{borderRadius:'18px', width:'90px', height:'90px', objectFit:'cover', marginBottom:'0.7em'}} src={r.image} alt={r.title} />
                  <RelatedCardTitle>{r.title}</RelatedCardTitle>
                </RelatedCard>
              ))}
            </RelatedList>
          </RelatedSection>
        )}
        <BackLink to="/">
          <FaArrowLeft /> トップページへ戻る
        </BackLink>
      </ArticleContainer>
    </>
  );
};

export default ArticlePage;
