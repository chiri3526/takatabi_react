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
            // 既に同じ href の external-link が container 内にあれば重複作成をスキップ
              try {
                const existing = doc.querySelector(`a.external-link[href="${href}"]`);
                if (existing) {
                  if (a.dataset) a.dataset.previewApplied = '1';
                  return;
                }
              } catch (e) { }


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
      // --- 追加: サーバ側で同一 href の external-link を重複削除 ---
      try {
        const seen = new Set();
        const anchorsAll = Array.from(doc.querySelectorAll('a.external-link'));
        anchorsAll.forEach(el => {
          try {
            const href0 = el.getAttribute('href');
            if (!href0) return;
            if (seen.has(href0)) {
              el.parentNode && el.parentNode.removeChild(el);
            } else {
              seen.add(href0);
            }
          } catch (e) {}
        });
      } catch (e) {}

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
  /* CONSOLIDATED: external-link unified card */

  /* Support standalone .ext-inner (server-produced) to display as unified card) */
  .ext-inner {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    border: 1px solid #e9f5ef;
    background: linear-gradient(180deg,#ffffff,#f8fff8);
    padding: 0.45rem 0.9rem;
    border-radius: 10px;
    margin: 0.6rem 0;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }
  /* Hide fully empty external-link anchors (e.g. stray anchors) */
  a.external-link:empty { display: none; }
  /* If an arrow anchor is a sibling after .ext-inner, visually overlap it on the card's right */
  .ext-inner + a.external-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    margin-left: -40px; /* overlap into card */
    padding: 0;
    background: transparent;
    border: none;
  }
  .ext-inner + a.external-link .ext-arrow {
    position: relative;
    right: 0;
    top: 0;
    transform: none;
    width: 16px;
    height: 16px;
    display: block;
    color: #2E7D32;
  }

  .external-link {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    border: 1px solid #e9f5ef;
    background: linear-gradient(180deg,#ffffff,#f8fff8);
    padding: 0.45rem 0.9rem;
    border-radius: 10px;
    margin: 0.6rem 0;
    text-decoration: none;
    color: inherit;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }
  .external-link:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,128,64,0.08); }
  .external-link .ext-inner { display:flex; flex-direction:row; align-items:center; gap:0.8rem; width:100%; min-width:0; flex:1 1 auto; padding-right:40px; }
  .external-link .ext-meta { display:flex; flex-direction:column; min-width:0; flex:1 1 auto; overflow:hidden; }
  .external-link .ext-title { font-weight:700; color: #2E7D32; font-size:0.95rem; line-height:1.25; white-space:normal; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .external-link .ext-domain { font-size:0.78rem; color: #21212188; margin-top:0.18rem; white-space:normal; word-break:break-all; }
  .external-link .ext-arrow { position:absolute; right:12px; top:50%; transform:translateY(-50%); width:16px; height:16px; display:flex; align-items:center; justify-content:center; color:#2E7D32; pointer-events:none; }
  .external-link .ext-arrow svg { width:100%; height:100%; display:block; stroke:currentColor; vector-effect:non-scaling-stroke; }
  @media (max-width:600px) { .external-link{padding:0.36rem 0.6rem;} .external-link .ext-inner{gap:0.6rem; padding-right:36px;} .external-link .ext-title{font-size:0.92rem; -webkit-line-clamp:2;} .external-link .ext-domain{font-size:0.75rem;} .external-link .ext-arrow{right:10px; width:14px; height:14px;} }


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

  /* リンクプレビュー用スタイル */
  .link-preview {
    display: flex;
    gap: 0.8em;
    align-items: center;
    border: 1px solid #e6f4ea;
    background: #fff;
    padding: 0.4rem;
    border-radius: 8px;
    margin-top: 0.6rem;
    text-decoration: none;
    color: inherit;
  }
  .link-preview img {
    width: 84px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
    background: #fff;
  }
  .link-preview .lp-title {
    font-weight: 700;
    color: ${theme.colors.primary};
    font-size: 0.92rem;
    line-height: 1.2;
  }

  /* 追加: 外部リンク用のカード表示 */
  .external-link_obsolete {
    display: block; /* anchor をブロックにして横幅いっぱいのカードにする */
    border: 1px solid #e9f5ef;
    background: linear-gradient(180deg,#ffffff,#f8fff8);
    padding: 0.45rem 0.6rem;
    border-radius: 10px;
    margin: 0.6rem 0;
    text-decoration: none;
    color: inherit;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    width: 100%;
    box-sizing: border-box; /* はみ出し防止 */
    overflow: hidden;
  }
  .external-link_obsolete:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,128,64,0.08); }

  /* 内部コンテナを横並びにする（左: favicon、右: meta） */
  .external-link_obsolete .ext-inner{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    padding-right: 28px; /* 右端の矢印分の余白を確保（ファビコン無しで少し小さめ） */
  }
  .external-link_obsolete .ext-meta { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
  .external-link_obsolete .ext-title { font-weight: 700; color: ${theme.colors.primary}; font-size: 0.95rem; white-space: normal; overflow: visible; word-break: break-word; }
  .external-link_obsolete .ext-domain { font-size: 0.75rem; color: ${theme.colors.text}99; margin-top: 0.18rem; white-space: normal; color: ${theme.colors.text}88; }

  /* モバイル（小さい画面）での折返し対応 */
  @media (max-width: 600px) {
    .external-link_obsolete {
      padding: 0.36rem 0.5rem;
      gap: 0.6rem;
      align-items: flex-start;
      /* ext-inner が折り返す */
    }
    .external-link_obsolete .ext-favicon {
      width: 28px !important;
      height: 28px !important;
    }
    .external-link_obsolete .ext-meta { min-width: 0; }
    .external-link_obsolete .ext-title {
      white-space: normal; /* 折り返す */
      font-size: 0.92rem;
      line-height: 1.2;
      overflow: visible;
    }
    .external-link_obsolete .ext-domain {
      white-space: normal;
      word-break: break-all; /* ドメインが長い場合に折り返す */
      color: ${theme.colors.text}88;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
  }

  /* タブレットで少し控��めに */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 既存スタイル続行 */
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
  img.cms-image,
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

  /* 横長カードを確実にするための微調整 */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 矢印を絶対配置で右端中央にするため */
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
    img:not(.ext-favicon) {
      width: calc(100% + 76px) !important;
      max-width: none !important;
      margin: 1.2em 50%;
      transform: translateX(-50%);
      border-radius: 12px;
      display: block;
    }
  }

  /* 追加: 外部リンクカードに矢印アイコンを表示 */
  .external-link_obsolete .ext-arrow {
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
    pointer-events: none; /* アイコン自体はクリック対象にしない（アンカー全体がリンク） */
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* モバイル用: 矢印アイコンを小さく */
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
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
// 小さく表示する日付コンポーネント（アイキャッチ上に右寄せでオーバーレイ表示）
const ArticleDate = styled.div`
  font-size: 0.65rem; /* かなり小さく */
  color: #444;
  text-align: right;
  position: absolute;
  top: 8px; /* アイキャッチ右上に配置 */
  right: 10px;
  background: rgba(255,255,255,0.85);
  padding: 0.12rem 0.4rem;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  z-index: 6;
`;

// 追加: アイキャッチ上に表示するタグのコンテナとバッジ
// （記事ページではタグ表示不要のため削除）

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
  font-size: 0.8rem;
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
          // 既に変換済みなら何もしない（data 属性・クラス・内部構造のいずれかで判定）
          if (a.dataset && a.dataset.previewApplied) return; // 既に処理済み
          if (a.classList && (a.classList.contains('external-link') || a.classList.contains('link-preview'))) {
            // 安全のためフラグをセット
            if (a.dataset && !a.dataset.previewApplied) a.dataset.previewApplied = '1';
            return;
          }
          if (a.querySelector && (a.querySelector('.ext-inner') || a.querySelector('.link-preview'))) {
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
            wrapper.className = 'link-preview';

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

    // 初回実行
    processAnchors();
    window.mergeSeparatedExtInner && window.mergeSeparatedExtInner();
    window.hideTextOnlyExternalAnchors && window.hideTextOnlyExternalAnchors();


    // --- converted: global utility functions for merging/hiding external links ---
    window.mergeSeparatedExtInner = function() {
      try {
        const containerEl = articleContentRef?.current || document.body;
        if (!containerEl) return;
        const inners = Array.from(containerEl.querySelectorAll('.ext-inner'));
        inners.forEach(inner => {
          // skip if already inside an anchor
          if (inner.closest('a.external-link')) return;
          // find nearest anchor siblings that share the same href
  // hrefCandidates / aSiblings removed (unused)
          // collect anchors that have same href and are adjacent to this inner
          let anchor = null;
          // look back
          let prev = inner.previousElementSibling;
          while(prev) { if (prev.tagName === 'A' && prev.classList.contains('external-link')) { anchor = prev; break; } prev = prev.previousElementSibling; }
          // look forward if not found
          if (!anchor) { let next = inner.nextElementSibling; while(next) { if (next.tagName === 'A' && next.classList.contains('external-link')) { anchor = next; break; } next = next.nextElementSibling; } }
          // if anchor still not found, try to find any anchor that has same href as inner's internal anchors
          if (!anchor) { const innerA = inner.querySelector('a.external-link'); const href = innerA ? innerA.getAttribute('href') : null; if (href) { anchor = Array.from(containerEl.querySelectorAll('a.external-link')).find(x=>x.getAttribute('href')===href); } }
          // if still not found, create one and insert before inner
          if (!anchor) { anchor = document.createElement('a'); anchor.className = 'external-link'; const innerA = inner.querySelector('a.external-link'); if (innerA && innerA.getAttribute('href')) anchor.setAttribute('href', innerA.getAttribute('href')); anchor.setAttribute('target','_blank'); anchor.setAttribute('rel','noopener noreferrer'); anchor.dataset.previewApplied = '1'; inner.parentNode.insertBefore(anchor, inner); }
          // move arrow if exists in adjacent anchor
          const possibleArrowAnchor = inner.nextElementSibling && inner.nextElementSibling.tagName==='A' && inner.nextElementSibling.classList.contains('external-link') && inner.nextElementSibling.querySelector('.ext-arrow') ? inner.nextElementSibling : null;
          if (possibleArrowAnchor) {
            const arrow = possibleArrowAnchor.querySelector('.ext-arrow');
            if (arrow) anchor.appendChild(arrow);
            try { possibleArrowAnchor.parentNode.removeChild(possibleArrowAnchor); } catch (e) {}
          }
          // replace any anchors inside inner with spans to avoid nested anchors
          const innerAnchors = Array.from(inner.querySelectorAll('a.external-link'));
          innerAnchors.forEach(aEl => { try { const span = document.createElement('span'); span.className = 'ext-link-text'; span.textContent = aEl.textContent || aEl.getAttribute('href') || ''; aEl.parentNode.replaceChild(span, aEl); } catch(e){} });
          // finally append inner into anchor
          try { anchor.appendChild(inner); } catch(e){}
        });
      } catch(e) {}
        };
        window.hideTextOnlyExternalAnchors = function() {
      try {
        const containerEl = articleContentRef?.current || document.body;
        if (!containerEl) return;
        const anchors = Array.from(containerEl.querySelectorAll('a.external-link'));
        anchors.forEach(a => {
          try {
            // skip anchors that have structured content or arrow inside
            if (a.querySelector('.ext-inner') || a.querySelector('.ext-arrow')) return;
            const href = (a.getAttribute('href') || '').trim();
            const txt = (a.textContent || '').trim();
            if (!href) return;
            if (!txt) { a.style.display = 'none'; return; }
            // if text exactly equals href (or equals href without protocol), hide it
            const noProto = href.replace(/^https?:\/\//, '');
            if (txt === href || txt === noProto) {
              a.style.display = 'none';
            }
          } catch (e) {}
        });
      } catch (e) {}
        };
    


    // --- 追加: クライアント側で分離している .ext-inner と隣接する a.external-link を統合する ---
    

    // --- 追加: テキストだけの a.external-link（URLそのものを表示しているもの）を非表示にする ---
    





    // --- 追加: クライアント側で分離している .ext-inner と隣接する a.external-link を統合する ---
    

    // --- 追加: テキストのみの a.external-link を非表示にする（URLだけのもの） ---
    




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
          setTimeout(()=>{ processAnchors(); window.mergeSeparatedExtInner && window.mergeSeparatedExtInner(); window.hideTextOnlyExternalAnchors && window.hideTextOnlyExternalAnchors(); }, 50);
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

  // AdSense広告の初期化
  useEffect(() => {
    if (window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {}
    }
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
        <div style={{display:'flex', justifyContent:'center', position: 'relative'}}>
          {/* 日付を画像の上、右寄せでオーバーレイ表示 */}
          {publishedDate && (
            <ArticleDate>
              {publishedDate} に公開
            </ArticleDate>
          )}
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
        <ArticleContent ref={articleContentRef} dangerouslySetInnerHTML={{ __html: contentWithIds }} />
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
