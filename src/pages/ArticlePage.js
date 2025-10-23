import React, { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { FaLink, FaArrowLeft } from 'react-icons/fa';
import { fetchArticleById, fetchArticles } from '../api/microcms';

// JSONファイルを一括取得（記事一覧を作るため）
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

// blogPosts: HomePage/CategoryPageと同じローカル記事配列を定義
const blogPosts = [
  ...jsonArticles
  // 必要ならここにjs記事やテスト記事を追加可能
];


// Google AdSense script を head に挿入するユーティリティ（重複挿入を防止）
function useAdsenseScript() {
  // 実行環境でのみ DOM にスクリプトを挿入
  try {
    if (typeof document === 'undefined') return;
    if (!document.querySelector('script[src*="adsbygoogle.js?client=ca-pub-7728107798566122"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7728107798566122';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  } catch (e) {
    // サーバーサイド環境やテスト環境では無視
  }
}

// 目次生成関数
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
    return `<img${before}src="${src}"${after}>`;
  });

  // --- 追加: img の inline 属性(width/height/style) を削除し class="cms-image" を付与 ---
  newHtml = newHtml.replace(/<img([^>]*)>/g, (match, attrs) => {
    // attrs 部から width, height, style を削除
    let cleaned = attrs.replace(/\s*(width|height)=["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*style=["'][^"']*["']/gi, '');
    // class があれば追記、なければ追加
    if (/class=/.test(cleaned)) {
      cleaned = cleaned.replace(/class=("|')(.*?)("|')/i, (m, q, cls) => `class=${q}${cls} cms-image${q}`);
    } else {
      cleaned = `${cleaned} class="cms-image"`;
    }
    return `<img${cleaned}>`;
  });

  // --- 追加: Google Maps のリンクを短いラベルに置換して target/rel を付与 ---
  // 例: <a href="https://www.google.com/maps/place/...">長いURL</a> を
  // <a href="..." target="_blank" rel="noopener noreferrer">📍 Googleマップ</a> に置換
  newHtml = newHtml.replace(/<a([^>]*href=["'][^"']*google\.com\/maps[^"']*["'][^>]*)>(.*?)<\/a>/gi, (match, attrs, inner) => {
    // attrs 内に target や rel があれば上書きしないよう除去してから付与
    let cleaned = attrs.replace(/\s*target=["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*rel=["'][^"']*["']/gi, '');
    // 最終的な anchor を返す
    return `<a${cleaned} target="_blank" rel="noopener noreferrer">📍 Googleマップ</a>`;
  });

  return { toc, html: newHtml };
}

const TocList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const TocItem = styled.li`
  margin: 0.2em 0 0.2em 0.5em;
  &.toc-h3 { margin-left: 1.5em; font-size: 0.95em; }
`;
const TocLink = styled.a`
  color: #2E7D32;
  text-decoration: none;
  &:hover { text-decoration: underline; color: #1B5E20; }
`;


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
const ArticleContent = styled.div`
  color: ${theme.colors.text};
  font-size: 1.0rem; /* 基本フォントを小さめに調整 */
  line-height: 1.7;
  font-family: 'Rounded Mplus 1c', 'Noto Sans JP', 'Meiryo', 'Hiragino Maru Gothic Pro', Arial, sans-serif;

  /* 本文内リンクの折り返しと最大幅制御 */
  a {
    overflow-wrap: anywhere;
    word-break: break-word;
    display: inline-block;
    max-width: 100%;
  }

  h2 {
    color: ${theme.colors.primary};
    font-size: 1.3rem;
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
    font-size: 1.1rem;
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

  /* 本文内画像をコンテナ内に収める */
  img,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 700px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: #fff;
    padding: 8px;
  }

  /* タブレットで少し控えめに */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* モバイルでは画像を少しはみ出させて目立たせつつ中央寄せ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* モバイルでも少し小さめに */
    img.cms-image,
    img {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }
`;

const ArticleContainer = styled.div`
  width: 70vw;
  max-width: 1100px;
  min-width: 320px;
  margin: 40px auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: ${theme.spacing.xlarge};
  @media (max-width: 900px) {
    width: 90vw;
    max-width: 98vw;
    padding: ${theme.spacing.large};
  }
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
  flex-direction: row;
  align-items: center;
  width: 640px; /* 横幅を広げる */
  max-width: calc(100% - 40px);
  min-height: 130px; /* 縦に少し広げる */
  background: #f6fff6;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
  text-decoration: none;
  transition: box-shadow 0.2s, transform 0.12s;
  border: 2px solid ${theme.colors.primary}22;
  padding: 0.9em;
  gap: 1em;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 28px rgba(0,128,64,0.14);
    border-color: ${theme.colors.primary};
  }
  @media (max-width: 900px) {
    width: calc(100% - 48px);
  }
  @media (max-width: 600px) {
    width: calc(100% - 32px);
    padding: 0.6em;
    min-height: 110px;
  }
`;
const RelatedImage = styled.img`
  width: 44%; /* 画像幅を大きくして目立たせる */
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 12px;
  margin: 0;
  flex-shrink: 0;
`;
const RelatedCardTitle = styled.div`
  color: ${theme.colors.primary};
  font-weight: 700;
  font-size: 0.8rem; /* 少し大きくして読みやすく */
  text-align: left;
  margin: 0;
  line-height: 1.25;
  word-break: break-word; /* 長い単語を折り返す */
  white-space: normal; /* 折り返し許可 */
`;

const ArticlePage = (props) => {
  useAdsenseScript();
  const adRef = useRef(null);
  const id = props.id;
  // undefined = 未取得（loading）、object = 取得済、 null = 取得失敗（見つからない）
  const [cmsArticle, setCmsArticle] = React.useState(undefined);
  // microCMS の記事リスト（関連記事抽出用）
  const [cmsArticlesList, setCmsArticlesList] = React.useState([]);
  // アイキャッチ画像の縦横判定フックは必ず呼ぶ
  const [isVertical, setIsVertical] = React.useState(false);
  // postはuseMemoで取得されるため、imageUrlは毎回計算
  const post = useMemo(() => {
    // まずローカル記事を探す
    const local = blogPosts.find(p => p.slug === id || p.id === id);
    if (local) return local;
    // ローカルに無ければ microCMS記事（APIで取得結果）を返す
    return cmsArticle;
  }, [id, cmsArticle]);
  const imageUrl = post?.image?.url || post?.image;
  React.useEffect(() => {
    // フックは必ず呼ばれる（条件分岐なし）
    if (!imageUrl) {
      setIsVertical(false);
      return;
    }
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = function() {
      if (img.naturalHeight > img.naturalWidth * 1.15) {
        setIsVertical(true);
      } else {
        setIsVertical(false);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    window.scrollTo(0, 0);
    // ローカル記事がなければmicroCMS APIで取得（未取得フラグをセット）
    const local = blogPosts.find(p => p.slug === id || p.id === id);
    if (!local) {
      setCmsArticle(undefined); // loading
      fetchArticleById(id).then(data => setCmsArticle(data)).catch(() => setCmsArticle(null));
    } else {
      // ローカル記事がある場合は CMS 側の状態をクリア
      setCmsArticle(null);
    }
    // 関連記事抽出のため microCMS の一覧を取得（軽量）
    fetchArticles().then(data => {
      if (data && Array.isArray(data.contents)) {
        setCmsArticlesList(data.contents);
      }
    }).catch(() => {});
  }, [id]);

  // AdSense広告の初期化
  useEffect(() => {
    if (window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {}
    }
  }, [id]);
  // 目次とid付きHTML生成
  const { toc, html: contentWithIds } = useMemo(() => generateTocAndContent(post?.content), [post]);
  // microCMS記事でも関連記事を表示（ローカル+CMS両方から抽出）
  const allArticles = [
    ...blogPosts,
    ...cmsArticlesList
  ];
  // 正規化したカテゴリ名を返すユーティリティ
  function getCategoryName(a) {
    if (!a) return undefined;
    if (a.category && typeof a.category === 'object') return a.category.name;
    return a.category;
  }
  // 現在の投稿の正規カテゴリ名
  const currentCatName = getCategoryName(post);
  // slug/id を文字列化
  const postSlug = post?.slug ? String(post.slug) : String(post?.id || '');
  const related = allArticles.filter(p => {
    const pSlug = p.slug ? String(p.slug) : String(p.id || '');
    // カテゴリ名が同じ、かつ自身以外
    return getCategoryName(p) === currentCatName && pSlug !== postSlug;
  });

  // ローカル記事もなく、まだ CMS からの取得が終わっていない場合は何も表示しない（フラッシュ防止）
  const hasLocal = blogPosts.find(p => p.slug === id || p.id === id);
  if (!post) {
    if (!hasLocal && cmsArticle === undefined) {
      // loading: 表示を出さずフラッシュを防止
      return null;
    }
    // 取得済みだが存在しない場合はメッセージ表示
    return <ArticleContainer>記事が見つかりませんでした。</ArticleContainer>;
  }


  return (
    <>
  {/* EyeCatch削除: 記事ごとの画像のみ表示 */}
      <ArticleContainer>
        <ArticleTitle>{post.title}</ArticleTitle>
        <div style={{display:'flex', justifyContent:'center'}}>
          <ArticleImageEyeCatch src={imageUrl} alt={post.title} className={isVertical ? 'vertical' : ''} />
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
              {related.map(r => {
                const relImg = r.image?.url || r.image;
                const relLink = `/?p=${r.slug || r.id}`;
                return (
                  <RelatedCard to={relLink} key={r.slug || r.id}>
                    <RelatedImage src={relImg} alt={r.title} />
                    <RelatedCardTitle>{r.title}</RelatedCardTitle>
                  </RelatedCard>
                );
              })}
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
