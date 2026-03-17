import React, { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { FaLink, FaArrowLeft, FaSearch, FaTag, FaClock, FaGlobeAsia } from 'react-icons/fa';
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
  useEffect(() => {
    // 実行環境でのみ DOM にスクリプトを挿入
    try {
      if (typeof document === 'undefined') return undefined;
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
    return undefined;
  }, []);
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
  newHtml = newHtml.replace(/<a([^>]*href=["'][^"']*google\.com\/maps[^"']*["'][^>]*)>(.*?)<\/a>/gi, (match, attrs, inner) => {
    let cleaned = attrs.replace(/\s*target=["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*rel=["'][^"']*["']/gi, '');
    return `<a${cleaned} target="_blank" rel="noopener noreferrer">📍 Googleマップ</a>`;
  });

  // --- 追加: ブラウザ環境では DOMParser を使って外部リンクをカードに変換 ---
  try {
    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(newHtml, 'text/html');
      const anchors = Array.from(doc.querySelectorAll('a'));
      anchors.forEach(a => {
        try {
          const href = a.getAttribute('href');
          if (!href) return;
          const url = new URL(href, window.location.origin);
          const isHttp = /^https?:/.test(url.protocol);
          const isSameOrigin = url.origin === window.location.origin;
          if (isHttp && !isSameOrigin) {
            const domain = url.hostname.replace(/^www\./, '');
            // 既存の external-link があっても上書きして一貫したプレビューにする。
            // （以前の実装は既存があればスキップしていたため、別の処理で変換済みの要素が
            // あるとここで何も起きず見た目が変わらない問題があった。）


            // ext-inner を作って内部を構築
            const wrapper = doc.createElement('div');
            wrapper.className = 'ext-inner';

            // ファビコンは表示しない（省略）: meta のみ作成
            const meta = doc.createElement('div');
            meta.className = 'ext-meta';

            const titleDiv = doc.createElement('div');
            titleDiv.className = 'ext-title';
            titleDiv.textContent = a.textContent ? a.textContent.trim() : href;

            const domainDiv = doc.createElement('div');
            domainDiv.className = 'ext-domain';
            domainDiv.textContent = domain;

            meta.appendChild(titleDiv);
            meta.appendChild(domainDiv);

            // wrapper の順序: メタのみ（ファビコンなし）
            wrapper.appendChild(meta);

            // 追加: 外部感を示す小さな矢印アイコンを追加
            const arrow = doc.createElement('span');
            arrow.className = 'ext-arrow';
            arrow.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>`;
            wrapper.appendChild(arrow);

            // アンカー自体を外部リンク表示に調整
            a.innerHTML = '';
            a.appendChild(wrapper);
            // preserve existing classes and add external-link
            a.className = (a.className ? a.className + ' external-link' : 'external-link');
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            // 変換済みフラグを付与（クライアント側処理の重複を避けるため）
            a.setAttribute('data-preview-applied', '1');
          }
        } catch (e) {
          // 個別アンカーの変換エラーは無視
        }
      });
      // シリアライズして戻す
      newHtml = doc.body.innerHTML;// シリアライズして戻す
      newHtml = doc.body.innerHTML;
    }
  } catch (e) {
    // DOMParser 系のエラーは無視して元の newHtml を返す
  }

  return { toc, html: newHtml };
}

const TocList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const TocItem = styled.li`
  margin: 0;
  &.toc-h3 {
    padding-left: 14px;
  }
`;

const TocLink = styled.a`
  display: block;
  padding: 6px 10px;
  border-radius: 8px;
  color: ${theme.colors.primary};
  text-decoration: none;
  line-height: 1.45;
  font-size: 0.95rem;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    color: #1b5e20;
    background: #edfaed;
  }

  &.active {
    color: #1b5e20;
    background: #e3f6e3;
    font-weight: 700;
  }
`;

const TopNav = styled.header`
  background: #ffffff;
  border: 1px solid ${theme.colors.primary}22;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

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

const ArticleContainer = styled.article`
  width: min(90vw, 1200px);
  margin: 18px auto 48px;
  background: transparent;
  padding: 0;

  @media (max-width: 1023px) {
    width: 92vw;
  }
`;

const ArticleHeaderMobile = styled.header`
  max-width: 760px;
  margin: 0 0 30px;
  padding: 8px 16px 0;

  @media (min-width: 601px) {
    display: none;
  }
`;

const ArticleTitle = styled.h1`
  margin: 0;
  color: ${theme.colors.primary};
  font-size: clamp(1.55rem, 2.2vw, 2.4rem);
  line-height: 1.6;
`;

const ArticleMetaRow = styled.div`
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6rem;

  @media (max-width: 600px) {
    margin-top: 0;
  }
`;

const ArticleHeader = styled.header`
  max-width: 760px;
  margin: 0;
  padding: 26px 28px;
  border-radius: 20px;
  background: rgba(17, 23, 18, 0.36);
  backdrop-filter: blur(2px);
  z-index: 2;

  @media (max-width: 600px) {
    display: none;
  }
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.4);
  font-size: clamp(2rem, 3vw, 3.25rem);
  line-height: 1.08;
`;

const HeroMetaRow = styled.div`
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6rem;
`;

const ArticleDate = styled.time`
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  color: ${theme.colors.text}bb;
  background: #f7fbf7;
  border: 1px solid ${theme.colors.primary}33;
  border-radius: 999px;
  padding: 0.28rem 0.62rem;
`;

const HeroDate = styled(ArticleDate)`
  color: #ebf9ee;
  background: rgba(41, 94, 51, 0.7);
  border: 1px solid #8fd89d55;
`;

const MobileHeroMeta = styled.div`
  display: none;

  @media (max-width: 600px) {
    display: flex;
    position: absolute;
    top: 12px;
    left: 12px;
    gap: 0.5rem;
    z-index: 2;
    flex-wrap: wrap;
  }
`;

const MobileHeroDate = styled(ArticleDate)`
  color: #ebf9ee;
  background: rgba(41, 94, 51, 0.74);
  border: 1px solid #8fd89d66;
`;

const ArticleImageWrap = styled.div`
  min-height: 420px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 22px;
  position: relative;
  padding: 44px;
  background: linear-gradient(180deg, rgba(10, 33, 16, 0.3), rgba(10, 33, 16, 0.52));
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  isolation: isolate;

  @media (max-width: 900px) {
    min-height: 340px;
    padding: 22px;
  }

`;

const ArticleImageEyeCatch = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  filter: saturate(0.95) contrast(1.04);
`;

const TocContainer = styled.nav`
  margin: 0 0 24px;
  background: #f6fff6;
  border: 1px solid ${theme.colors.primary}2f;
  border-radius: 12px;
  padding: 16px;
`;

const TocTitle = styled.strong`
  display: block;
  color: #1b5e20;
  margin-bottom: 10px;
  font-size: 0.95rem;
`;

const ArticleBodyGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const ArticleMain = styled.section`
  min-width: 0;
  background: #f7faf7;
  border: 1px solid ${theme.colors.primary}1f;
  border-radius: 14px;
  padding: 22px;
`;

const ArticleSidebar = styled.aside`
  position: sticky;
  top: 88px;
  min-width: 0;

  @media (max-width: 1100px) {
    position: static;
  }
`;

const SidebarCard = styled.section`
  background: #f7faf7;
  border: 1px solid ${theme.colors.primary}20;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
`;

const SidebarTitle = styled.h3`
  margin: 0 0 10px;
  color: ${theme.colors.primary};
  font-size: 0.95rem;
  font-weight: 700;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid ${theme.colors.primary}26;
  background: #fff;
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  color: ${theme.colors.primary};

  input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 0.86rem;
    background: transparent;
  }
`;

const TagPillList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const TagPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid ${theme.colors.primary}22;
  background: #ecf8ec;
  color: ${theme.colors.primary};
  border-radius: 999px;
  padding: 0.24rem 0.58rem;
  font-size: 0.78rem;
  font-weight: 600;
`;

const SidebarPostList = styled.div`
  display: grid;
  gap: 10px;
`;

const SidebarPostItem = styled(Link)`
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 8px;
  text-decoration: none;
  color: inherit;
`;

const SidebarPostThumb = styled.img`
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
`;

const SidebarPostTitle = styled.div`
  font-size: 0.84rem;
  line-height: 1.35;
  color: ${theme.colors.text};
  font-weight: 600;
`;

const ArticleContent = styled.div`
  max-width: none;
  margin: 0;
  color: ${theme.colors.text};
  font-size: 1.03rem;
  line-height: 1.9;
  font-family: 'Rounded Mplus 1c', 'Noto Sans JP', 'Meiryo', 'Hiragino Maru Gothic Pro', Arial, sans-serif;

  p {
    margin: 0 0 1.05em;
    max-width: 920px;
    margin-left: auto;
    margin-right: auto;
  }

  @media (min-width: 1024px) {
    p {
      max-width: 760px;
    }
  }

  ul,
  ol {
    margin: 0.2em 0 1.1em;
    padding-left: 1.4em;
  }

  li {
    margin-bottom: 0.42em;
    line-height: 1.85;
  }

  h2,
  h3,
  h4 {
    scroll-margin-top: 90px;
  }

  h2 {
    color: ${theme.colors.primary};
    font-size: clamp(1.3rem, 1.5vw, 1.5rem);
    border-left: 7px solid ${theme.colors.primary};
    border-radius: 0 12px 12px 0;
    padding: 0.28em 0 0.28em 0.7em;
    margin: 2.1em 0 0.95em;
    font-weight: 700;
    background: #f6fff6;
  }

  h3 {
    color: ${theme.colors.secondary};
    font-size: clamp(1.12rem, 1.25vw, 1.23rem);
    margin: 1.7em 0 0.72em;
    font-weight: 700;
    border-left: 5px solid ${theme.colors.secondary};
    border-radius: 0 10px 10px 0;
    padding: 0.22em 0 0.22em 0.6em;
    background: #eaffea;
  }

  h4 {
    color: ${theme.colors.accent};
    font-size: clamp(1.02rem, 1.1vw, 1.1rem);
    margin: 1.45em 0 0.6em;
    font-weight: 700;
    border-left: 4px dashed ${theme.colors.accent};
    border-radius: 0 8px 8px 0;
    padding-left: 0.5em;
    background: #f9fff6;
  }

  strong,
  .em {
    color: ${theme.colors.highlight};
    background: #fffbe6;
    font-weight: 700;
    padding: 0 0.2em;
    border-radius: 4px;
  }

  a {
    overflow-wrap: anywhere;
    word-break: break-word;
    max-width: 100%;
  }

  .link-preview {
    display: block;
    margin: 0.7rem 0;
    text-decoration: none;
    color: inherit;
    border: none;
    background: transparent;
    padding: 0;
  }

  .link-preview:empty {
    display: none;
  }

  .link-preview .lp-inner {
    display: flex;
    gap: 0.8em;
    align-items: center;
    border: 1px solid #e6f4ea;
    background: transparent;
    padding: 0.5rem;
    border-radius: 10px;
  }

  .link-preview .lp-inner img {
    width: 84px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
    background: transparent;
  }

  .link-preview .lp-inner .lp-title {
    font-weight: 700;
    color: ${theme.colors.primary};
    font-size: 0.92rem;
    line-height: 1.3;
  }

  .ext-inner {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    border: 1px solid #e9f5ef;
    background: linear-gradient(180deg, #ffffff, #f8fff8);
    padding: 8px 14px;
    border-radius: 10px;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  a.external-link:empty {
    display: none;
  }

  .external-link {
    display: flex;
    align-items: center;
    border: 1px solid #e9f5ef;
    background: linear-gradient(180deg, #ffffff, #f8fff8);
    border-radius: 10px;
    margin: 0.7rem 0;
    text-decoration: none;
    color: inherit;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }

  .external-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 128, 64, 0.08);
  }

  .external-link .ext-inner {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    min-width: 0;
    flex: 1 1 auto;
  }

  .external-link .ext-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .external-link .ext-title {
    font-weight: 700;
    color: ${theme.colors.primary};
    font-size: 0.95rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .external-link .ext-domain {
    font-size: 0.78rem;
    color: #21212188;
    margin-top: 0.18rem;
    word-break: break-all;
  }

  .external-link .ext-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.colors.primary};
    pointer-events: none;
  }

  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 520px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    cursor: zoom-in;
  }

  @media (max-width: 900px) {
    img.cms-image,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
      max-width: none !important;
    }
  }

  @media (max-width: 1023px) {
    font-size: 1rem;
    line-height: 1.82;
  }

  @media (max-width: 600px) {
    font-size: 0.98rem;
    line-height: 1.8;

    img.cms-image,
    .cms-image {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }

    .external-link .ext-title {
      font-size: 0.92rem;
    }

    .external-link .ext-domain {
      font-size: 0.75rem;
    }

    .external-link .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }
`;

const ImageViewerOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  cursor: zoom-out;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: opacity 280ms ease;
  pointer-events: ${props => (props.$visible ? 'auto' : 'none')};

  @media (max-width: 600px) {
    padding: 14px;
    align-items: flex-start;
  }
`;

const ImageViewerDialog = styled.div`
  position: relative;
  width: min(96vw, 1200px);
  height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transform: ${props => (props.$visible ? 'scale(1)' : 'scale(0.985)')};
  transition: opacity 280ms ease, transform 280ms ease;
  pointer-events: none;
`;

const ImageViewerImage = styled.img`
  max-width: min(96vw, 1200px);
  max-height: 92vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.5);
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: auto;
`;

const AdContainer = styled.div`
  margin: 32px 0;
  display: flex;
  justify-content: center;
`;

const RelatedSection = styled.section`
  margin: 56px 0 0;
  padding-top: 24px;
  border-top: 1px solid ${theme.colors.primary}33;
`;

const RelatedTitle = styled.h3`
  color: ${theme.colors.primary};
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5em;
  margin-bottom: 1em;
`;

const RelatedList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
`;

const RelatedCard = styled(Link)`
  display: grid;
  grid-template-columns: 220px 1fr;
  align-items: center;
  background: #f6fff6;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: box-shadow 0.2s, transform 0.12s;
  border: 2px solid ${theme.colors.primary}22;
  padding: 0.85em;
  gap: 1em;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0, 128, 64, 0.14);
    border-color: ${theme.colors.primary};
  }

  @media (max-width: 900px) {
    grid-template-columns: 160px 1fr;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    padding: 0.6em;
  }
`;

const RelatedImage = styled.img`
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 10px;
  margin: 0;
`;

const RelatedCardTitle = styled.div`
  color: ${theme.colors.primary};
  font-weight: 700;
  font-size: 0.95rem;
  text-align: left;
  margin: 0;
  line-height: 1.45;
  word-break: break-word;
`;

const BackLinkWrap = styled.div`
  margin: 28px 0 0;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  color: ${theme.colors.primary};
  text-decoration: none;
  font-weight: 700;
  font-size: 1.02rem;
  background: #f6fff6;
  border-radius: 8px;
  padding: 0.55em 1.2em;
  box-shadow: 0 2px 8px rgba(0, 128, 64, 0.07);
  border: 1.5px solid ${theme.colors.primary}33;
  transition: background 0.2s, color 0.2s, border 0.2s;

  &:hover {
    background: ${theme.colors.primary};
    color: #fff;
    border-color: ${theme.colors.primary};
  }
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
  const [activeHeadingId, setActiveHeadingId] = React.useState('');
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerMounted, setViewerMounted] = React.useState(false);
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [viewerSrc, setViewerSrc] = React.useState('');
  const [viewerAlt, setViewerAlt] = React.useState('');
  const [activeTriggerEl, setActiveTriggerEl] = React.useState(null);
  const viewerCloseTimeoutRef = useRef(null);
  const viewerOpenRafRef = useRef(null);
  const closeViewer = React.useCallback(() => {
    setViewerVisible(false);
    setViewerOpen(false);
    if (viewerCloseTimeoutRef.current) {
      clearTimeout(viewerCloseTimeoutRef.current);
    }
    viewerCloseTimeoutRef.current = window.setTimeout(() => {
      setViewerMounted(false);
    }, 280);
  }, []);
  // postはuseMemoで取得されるため、imageUrlは毎回計算
  const post = useMemo(() => {
    // まずローカル記事を探す
    const local = blogPosts.find(p => p.slug === id || p.id === id);
    if (local) return local;
    // ローカルに無ければ microCMS記事（APIで取得結果）を返す
    return cmsArticle;
  }, [id, cmsArticle]);
  const imageUrl = post?.image?.url || post?.image;

  // ref: 本文コンテナを直接操作してリンクプレビュー挿入
  const articleContentRef = useRef(null);

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

  // --- 追加: 記事の公開日 / 作成日 を安全に拾って日本ロケールで整形 ---
  const publishedRaw = post?.publishedAt || post?.createdAt || post?.date || post?.published;
  const publishedDate = publishedRaw
    ? new Date(publishedRaw).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : null;

  // 目次とid付きHTML生成（useEffectより前に定義しておく）
  const { toc, html: contentWithIds } = useMemo(() => generateTocAndContent(post?.content), [post]);

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

  // 記事本文の HTML に含まれるリンクを検出し、同一サイト内の記事リンクならプレビューに置換する
  useEffect(() => {
    if (!articleContentRef.current) return;
    const container = articleContentRef.current;

    // デバッグ: contentWithIds の中身（長さ）を表示
    try {
      // eslint-disable-next-line no-console
      console.log('[ArticlePage] contentWithIds length:', contentWithIds ? String(contentWithIds.length) : 'null/undefined');
    } catch (e) {}

    const processAnchors = () => {
      const anchors = Array.from(container.querySelectorAll('a'));
      if (!anchors.length) return;

      anchors.forEach(a => {
        try {
          // 既に変換済みの内部リンクプレビューはスキップ
          if (a.classList && a.classList.contains('link-preview')) return;
          if (a.querySelector && a.querySelector('.link-preview')) return;

          // 正常な外部リンクカードはスキップ。壊れた外部リンクは再構築する。
          if (a.classList && a.classList.contains('external-link') && a.querySelector('.ext-inner')) {
            if (a.dataset && !a.dataset.previewApplied) a.dataset.previewApplied = '1';
            return;
          }
          const href = a.getAttribute('href');
          if (!href) return;

          // デバッグ
          // eslint-disable-next-line no-console
          console.log('[ArticlePage] processing anchor:', href);

          const url = new URL(href, window.location.origin);
          const p = url.searchParams.get('p');
          let target = null;
          if (p) {
            target = [...blogPosts, ...cmsArticlesList].find(x => String(x.slug) === String(p) || String(x.id) === String(p));
          } else {
            const path = url.pathname || '';
            if (path && path !== '/') {
              const parts = path.split('/').filter(Boolean);
              const last = parts[parts.length - 1];
              if (last) {
                target = [...blogPosts, ...cmsArticlesList].find(x => String(x.slug) === String(last) || String(x.id) === String(last));
              }
            }
          }

          if (target) {
            // 内部プレビュー
            const imgSrc = target.image?.url || target.image || '/sample-images/no-image.jpg';
            const wrapper = document.createElement('div');
            wrapper.className = 'lp-inner';

            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = target.title || '';
            img.onerror = function() { this.src = '/sample-images/no-image.jpg'; };

            const titleDiv = document.createElement('div');
            titleDiv.className = 'lp-title';
            titleDiv.textContent = target.title || String(target.id || target.slug || href);

            wrapper.appendChild(img);
            wrapper.appendChild(titleDiv);

            a.innerHTML = '';
            a.appendChild(wrapper);
            a.classList.add('link-preview');
            a.dataset.previewApplied = '1';
            a.dataset.previewHref = url.href;
          } else {
            // 外部リンク
            const isHttp = /^https?:/.test(url.protocol);
            const isSameOrigin = url.origin === window.location.origin;
            if (isHttp && !isSameOrigin) {
              const domain = url.hostname.replace(/^www\./, '');

              const wrapper = document.createElement('div');
              wrapper.className = 'ext-inner';

              // ファビコンは表示しない（省略）。meta のみ作成。
              const meta = document.createElement('div');
              meta.className = 'ext-meta';

              const titleDiv = document.createElement('div');
              titleDiv.className = 'ext-title';
              titleDiv.textContent = a.textContent ? a.textContent.trim() : href;

              const domainDiv = document.createElement('div');
              domainDiv.className = 'ext-domain';
              domainDiv.textContent = domain;

              meta.appendChild(titleDiv);
              meta.appendChild(domainDiv);

              wrapper.appendChild(meta);

              // 追加: 外部感を示す小さな矢印アイコンを追加
              const arrow = document.createElement('span');
              arrow.className = 'ext-arrow';
              arrow.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>`;
              wrapper.appendChild(arrow);

              a.innerHTML = '';
              a.appendChild(wrapper);
              a.classList.add('external-link');
              a.setAttribute('target', '_blank');
              a.setAttribute('rel', 'noopener noreferrer');
              a.dataset.previewApplied = '1';
              a.dataset.previewHref = url.href;

              // eslint-disable-next-line no-console
              console.log('[ArticlePage] converted external link:', href, '->', domain);
            }
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[ArticlePage] anchor processing failed for', a, e);
        }
      });
    };

    const removeDuplicatePreviewCards = () => {
      const seen = new Set();
      const previewAnchors = Array.from(container.querySelectorAll('a.link-preview[data-preview-href]'));
      previewAnchors.forEach(a => {
        if (!a.querySelector('.lp-inner') || !a.querySelector('.lp-title')) {
          a.remove();
          return;
        }
        const href = a.dataset.previewHref;
        if (!href) return;
        if (seen.has(href)) {
          a.remove();
          return;
        }
        seen.add(href);
      });
    };

    const removeDuplicateExternalCards = () => {
      const seen = new Set();
      const externalAnchors = Array.from(container.querySelectorAll('a.external-link'));
      externalAnchors.forEach(a => {
        const inner = a.querySelector('.ext-inner');
        const title = a.querySelector('.ext-title');
        // 正常なカード構造でないものは削除
        if (!inner || !title) {
          a.remove();
          return;
        }
        const href = a.dataset.previewHref || a.getAttribute('href') || '';
        if (!href) {
          a.remove();
          return;
        }
        // 同一URLの外部リンクカードは先頭1件だけ残す
        if (seen.has(href)) {
          a.remove();
          return;
        }
        seen.add(href);
      });
    };

    // 初回実行
    processAnchors();
    removeDuplicatePreviewCards();
    removeDuplicateExternalCards();

    // MutationObserver で遅延挿入されるリンクに対応する
    let observer = null;
    try {
      observer = new MutationObserver(mutations => {
        let shouldProcess = false;
        for (const m of mutations) {
          if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
            shouldProcess = true;
            break;
          }
        }
        if (shouldProcess) {
          // 小さな遅延で再処理
          setTimeout(() => {
            processAnchors();
            removeDuplicatePreviewCards();
            removeDuplicateExternalCards();
          }, 50);
        }
      });
      observer.observe(container, { childList: true, subtree: true });
    } catch (e) {
      // 観測に失敗しても問題ない
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [contentWithIds, cmsArticlesList]);

  useEffect(() => {
    if (!articleContentRef.current) return;
    const container = articleContentRef.current;

    const handleImageClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const image = target.closest('img.cms-image');
      if (!image || !container.contains(image)) return;

      const src = image.getAttribute('src');
      if (!src) return;

      event.preventDefault();
      if (!image.hasAttribute('tabindex')) {
        image.setAttribute('tabindex', '-1');
      }
      setActiveTriggerEl(image);
      setViewerSrc(src);
      setViewerAlt(image.getAttribute('alt') || '');
      if (viewerCloseTimeoutRef.current) {
        clearTimeout(viewerCloseTimeoutRef.current);
        viewerCloseTimeoutRef.current = null;
      }
      if (viewerOpenRafRef.current) {
        cancelAnimationFrame(viewerOpenRafRef.current);
        viewerOpenRafRef.current = null;
      }
      if (!viewerMounted) {
        setViewerMounted(true);
        setViewerVisible(false);
      }
      if (!viewerOpen) {
        setViewerOpen(true);
      }
      viewerOpenRafRef.current = window.requestAnimationFrame(() => {
        setViewerVisible(true);
      });
    };

    container.addEventListener('click', handleImageClick);
    return () => {
      container.removeEventListener('click', handleImageClick);
    };
  }, [contentWithIds, viewerMounted, viewerOpen]);

  useEffect(() => {
    if (!viewerOpen) {
      if (activeTriggerEl && typeof activeTriggerEl.focus === 'function') {
        try {
          activeTriggerEl.focus({ preventScroll: true });
        } catch (e) {
          activeTriggerEl.focus();
        }
      }
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeViewer();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [viewerOpen, activeTriggerEl, closeViewer]);

  useEffect(() => {
    return () => {
      if (viewerCloseTimeoutRef.current) {
        clearTimeout(viewerCloseTimeoutRef.current);
      }
      if (viewerOpenRafRef.current) {
        cancelAnimationFrame(viewerOpenRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!toc.length || !articleContentRef.current) {
      setActiveHeadingId('');
      return;
    }

    const container = articleContentRef.current;
    const headings = Array.from(container.querySelectorAll('h2[id], h3[id]'));
    if (!headings.length) return;

    setActiveHeadingId(toc[0]?.id || '');

    let frameId = null;
    const resolveActiveHeading = () => {
      const triggerY = window.innerHeight * 0.22;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= triggerY) {
          current = heading;
        } else {
          break;
        }
      }
      if (current && current.id) {
        setActiveHeadingId(current.id);
      }
      frameId = null;
    };

    const onScroll = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(resolveActiveHeading);
    };

    resolveActiveHeading();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [toc, contentWithIds]);

  // AdSense広告の初期化
  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    const initializeAd = () => {
      if (cancelled || !adRef.current) return;

      if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
        try {
          window.adsbygoogle.push({});
        } catch (e) {}
        return;
      }

      if (retries < 20) {
        retries += 1;
        window.setTimeout(initializeAd, 150);
      }
    };

    initializeAd();
    return () => {
      cancelled = true;
    };
  }, [id]);
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
    return getCategoryName(p) === currentCatName && pSlug !== postSlug;
  }).slice(0, 3);

  const tagField = post?.tag || post?.tags || null;
  const tagLabels = useMemo(() => {
    if (Array.isArray(tagField)) {
      return tagField
        .map(t => (t && typeof t === 'object') ? (t.name || t.id || '') : String(t))
        .filter(Boolean);
    }
    if (typeof tagField === 'string') return [tagField];
    if (tagField && typeof tagField === 'object') {
      const label = tagField.name || tagField.id || '';
      return label ? [label] : [];
    }
    return [];
  }, [tagField]);

  const popularPosts = allArticles
    .filter(p => {
      const pSlug = p.slug ? String(p.slug) : String(p.id || '');
      return pSlug !== postSlug;
    })
    .slice(0, 4);

  const readingMinutes = useMemo(() => {
    const plain = String(post?.content || '').replace(/<[^>]+>/g, ' ');
    const words = plain.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.ceil(words / 220));
  }, [post]);

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
    <ArticleContainer>
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

      {!imageUrl && (
      <ArticleHeader>
        <HeroTitle>{post.title}</HeroTitle>
        <HeroMetaRow>
          <HeroDate><FaClock /> {readingMinutes} min read</HeroDate>
          {publishedDate && (
            <HeroDate dateTime={publishedRaw}>{publishedDate}</HeroDate>
          )}
        </HeroMetaRow>
      </ArticleHeader>
      )}

      <ArticleHeaderMobile>
        <ArticleTitle>{post.title}</ArticleTitle>
        {!imageUrl && (
          <ArticleMetaRow>
            <ArticleDate><FaClock /> {readingMinutes} min read</ArticleDate>
            {publishedDate && (
              <ArticleDate dateTime={publishedRaw}>{publishedDate}</ArticleDate>
            )}
          </ArticleMetaRow>
        )}
      </ArticleHeaderMobile>

      {imageUrl && (
        <ArticleImageWrap>
          <ArticleImageEyeCatch src={imageUrl} alt={post.title} className={isVertical ? 'vertical' : ''} />
          <MobileHeroMeta>
            <MobileHeroDate><FaClock /> {readingMinutes} min read</MobileHeroDate>
            {publishedDate && (
              <MobileHeroDate dateTime={publishedRaw}>{publishedDate}</MobileHeroDate>
            )}
          </MobileHeroMeta>
          <ArticleHeader>
            <HeroTitle>{post.title}</HeroTitle>
            <HeroMetaRow>
              <HeroDate><FaClock /> {readingMinutes} min read</HeroDate>
              {publishedDate && (
                <HeroDate dateTime={publishedRaw}>{publishedDate}</HeroDate>
              )}
            </HeroMetaRow>
          </ArticleHeader>
        </ArticleImageWrap>
      )}

      <ArticleBodyGrid>
        <ArticleMain>
          {toc.length > 0 && (
            <TocContainer aria-label="目次">
              <TocTitle>Table of Contents</TocTitle>
              <TocList>
                {toc.map(item => (
                  <TocItem key={item.id} className={`toc-${item.tag}`}>
                    <TocLink
                      href={`#${item.id}`}
                      className={activeHeadingId === item.id ? 'active' : ''}
                      aria-current={activeHeadingId === item.id ? 'location' : undefined}
                    >
                      {item.text}
                    </TocLink>
                  </TocItem>
                ))}
              </TocList>
            </TocContainer>
          )}

          <ArticleContent ref={articleContentRef} dangerouslySetInnerHTML={{ __html: contentWithIds }} />

          <AdContainer>
            <ins
              className="adsbygoogle"
              style={{ display: 'block', textAlign: 'center' }}
              data-ad-layout="in-article"
              data-ad-format="fluid"
              data-ad-client="ca-pub-7728107798566122"
              data-ad-slot="5951785085"
              ref={adRef}
            ></ins>
          </AdContainer>

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

          <BackLinkWrap>
            <BackLink to="/">
              <FaArrowLeft /> トップページへ戻る
            </BackLink>
          </BackLinkWrap>
        </ArticleMain>

        <ArticleSidebar>
          <SidebarCard>
            <SidebarTitle>Search</SidebarTitle>
            <SearchBox>
              <FaSearch />
              <input placeholder="Search..." aria-label="search" />
            </SearchBox>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Tags</SidebarTitle>
            <TagPillList>
              {tagLabels.length > 0 ? tagLabels.map(tag => (
                <TagPill key={tag}><FaTag /> {tag}</TagPill>
              )) : (
                <TagPill><FaTag /> travel</TagPill>
              )}
            </TagPillList>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Popular Posts</SidebarTitle>
            <SidebarPostList>
              {popularPosts.map(p => {
                const thumb = p.image?.url || p.image || '/sample-images/no-image.jpg';
                return (
                  <SidebarPostItem to={`/?p=${p.slug || p.id}`} key={p.slug || p.id}>
                    <SidebarPostThumb src={thumb} alt={p.title} />
                    <SidebarPostTitle>{p.title}</SidebarPostTitle>
                  </SidebarPostItem>
                );
              })}
            </SidebarPostList>
          </SidebarCard>
        </ArticleSidebar>
      </ArticleBodyGrid>
      {viewerMounted && (
        <ImageViewerOverlay
          $visible={viewerVisible}
          onClick={closeViewer}
          aria-hidden="true"
        >
          <ImageViewerDialog
            role="dialog"
            aria-modal="true"
            aria-label="画像プレビュー"
            $visible={viewerVisible}
          >
            <ImageViewerImage src={viewerSrc} alt={viewerAlt} />
          </ImageViewerDialog>
        </ImageViewerOverlay>
      )}
    </ArticleContainer>
  );
};

export default ArticlePage;
