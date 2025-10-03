import React, { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { FaLink, FaArrowLeft } from 'react-icons/fa';
import article1234 from '../articles/1234';
import article1235 from '../articles/1235';
import articleTest from '../articles/test';


// 目次(Toc)コンポーネント
const TocContainer = styled.nav`
  background: #f6fff6;
  border: 2px solid #2E7D32;
  border-radius: 12px;
  padding: 1em 1.5em;
  margin: 2em auto 2em auto;
  font-size: 0.98rem;
  width: 60%;
  max-width: 500px;
  min-width: 220px;
  box-sizing: border-box;
  display: block;
  @media (max-width: 600px) {
    width: 80vw;
    font-size: 0.92rem;
    padding: 0.7em 0.7em;
  }
`;
const TocList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const TocItem = styled.li`
  margin: 0.2em 0 0.2em 0.5em;
  &.toc-h3 { margin-left: 1.5em; font-size: 0.95em; }
  @media (max-width: 600px) {
    &.toc-h3 { margin-left: 1em; font-size: 0.9em; }
  }
`;
const TocLink = styled.a`
  color: #2E7D32;
  text-decoration: none;
  &:hover { text-decoration: underline; color: #1B5E20; }
`;

function generateTocAndContent(html) {
  if (!html) return { toc: [], html };
  let idx = 0;
  const toc = [];
  // h2/h3タグにidを付与しつつtoc配列を作る
  let newHtml = html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/g, (match, tag, attrs, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '');
    const id = `heading-${tag}-${idx++}`;
    toc.push({ tag, text: cleanText, id });
    return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
  });
  // imgタグのsrcが/contents/で始まる場合、絶対パスに補正
  newHtml = newHtml.replace(/<img([^>]*?)src=["'](\/contents\/[^"'>]+)["']([^>]*)>/g, (match, before, src, after) => {
    // Netlify等のpublic直下をルートとする
    return `<img${before}src="${src}"${after}>`;
  });
  return { toc, html: newHtml };
}

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
  @media (max-width: 600px) {
    width: 50%;
    height: 70px;
    max-width: 180px;
    min-width: 80px;
    margin-top: 60px;
    border-radius: 0;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
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
  // 目次とid付きHTML生成
  const { toc, html: contentWithIds } = useMemo(() => generateTocAndContent(post?.content), [post]);
  // 関連記事（同じカテゴリで自分以外）
  const related = blogPosts.filter(p => p.category === post?.category && p.slug !== id);

  if (!post) {
    return <ArticleContainer>記事が見つかりませんでした。</ArticleContainer>;
  }

  return (
    <>
  {/* EyeCatch削除: 記事ごとの画像のみ表示 */}
      <ArticleContainer>
        <ArticleTitle>{post.title}</ArticleTitle>
        <div style={{display:'flex', justifyContent:'center'}}>
          <ArticleImageEyeCatch src={post.image} alt={post.title} />
        </div>
        {/* 目次 */}
        {toc.length > 0 && (
          <TocContainer aria-label="目次">
            <strong style={{color:'#1B5E20'}}>目次</strong>
            <TocList>
              {toc.map(item => (
                <TocItem key={item.id} className={`toc-${item.tag}`}>
                  <TocLink href={`#${item.id}`}>{item.text}</TocLink>
                </TocItem>
              ))}
            </TocList>
          </TocContainer>
        )}
        <ArticleContent dangerouslySetInnerHTML={{ __html: contentWithIds }} />
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
