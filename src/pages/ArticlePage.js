import React, { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { FaLink, FaArrowLeft } from 'react-icons/fa';
import { fetchArticleById, fetchArticles } from '../api/microcms';

// JSON繝輔ぃ繧､繝ｫ繧剃ｸ諡ｬ蜿門ｾ暦ｼ郁ｨ倅ｺ倶ｸ隕ｧ繧剃ｽ懊ｋ縺溘ａ・・function importAllJson(r) {
  return r.keys().map(key => {
    const data = r(key);
    return {
      id: data.id || data.slug || key.replace(/^.*[/]/, '').replace(/\.json$/, ''),
      ...data
    };
  });
}

const jsonArticles = importAllJson(require.context('../articles', false, /\.json$/));

// blogPosts: HomePage/CategoryPage縺ｨ蜷後§繝ｭ繝ｼ繧ｫ繝ｫ險倅ｺ矩・蛻励ｒ螳夂ｾｩ
const blogPosts = [
  ...jsonArticles
  // 蠢・ｦ√↑繧峨％縺薙↓js險倅ｺ九ｄ繝・せ繝郁ｨ倅ｺ九ｒ霑ｽ蜉蜿ｯ閭ｽ
];


// Google AdSense script 繧・head 縺ｫ謖ｿ蜈･縺吶ｋ繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ・磯㍾隍・諺蜈･繧帝亟豁｢・・function useAdsenseScript() {
  // 螳溯｡檎腸蠅・〒縺ｮ縺ｿ DOM 縺ｫ繧ｹ繧ｯ繝ｪ繝励ヨ繧呈諺蜈･
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
    // 繧ｵ繝ｼ繝舌・繧ｵ繧､繝臥腸蠅・ｄ繝・せ繝育腸蠅・〒縺ｯ辟｡隕・  }
}

// 逶ｮ谺｡逕滓・髢｢謨ｰ
function generateTocAndContent(html) {
  if (!html) return { toc: [], html };
  let idx = 0;
  const toc = [];
  // h2/h3繧ｿ繧ｰ縺ｫid繧剃ｻ倅ｸ弱＠縺､縺､toc驟榊・繧剃ｽ懊ｋ
  let newHtml = html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/g, (match, tag, attrs, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '');
    const id = `heading-${tag}-${idx++}`;
    toc.push({ tag, text: cleanText, id });
    return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
  });
  // img繧ｿ繧ｰ縺ｮsrc縺・contents/縺ｧ蟋九∪繧句ｴ蜷医∫ｵｶ蟇ｾ繝代せ縺ｫ陬懈ｭ｣
  newHtml = newHtml.replace(/<img([^>]*?)src=["'](\/contents\/[^"'>]+)["']([^>]*)>/g, (match, before, src, after) => {
    return `<img${before}src="${src}"${after}>`;
  });

  // --- 霑ｽ蜉: img 縺ｮ inline 螻樊ｧ(width/height/style) 繧貞炎髯､縺・class="cms-image" 繧剃ｻ倅ｸ・---
  newHtml = newHtml.replace(/<img([^>]*)>/g, (match, attrs) => {
    // attrs 驛ｨ縺九ｉ width, height, style 繧貞炎髯､
    let cleaned = attrs.replace(/\s*(width|height)=["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*style=["'][^"']*["']/gi, '');
    // class 縺後≠繧後・霑ｽ險倥√↑縺代ｌ縺ｰ霑ｽ蜉
    if (/class=/.test(cleaned)) {
      cleaned = cleaned.replace(/class=("|')(.*?)("|')/i, (m, q, cls) => `class=${q}${cls} cms-image${q}`);
    } else {
      cleaned = `${cleaned} class="cms-image"`;
    }
    return `<img${cleaned}>`;
  });

  // --- 霑ｽ蜉: Google Maps 縺ｮ繝ｪ繝ｳ繧ｯ繧堤洒縺・Λ繝吶Ν縺ｫ鄂ｮ謠帙＠縺ｦ target/rel 繧剃ｻ倅ｸ・---
  newHtml = newHtml.replace(/<a([^>]*href=["'][^"']*google\.com\/maps[^"']*["'][^>]*)>(.*?)<\/a>/gi, (match, attrs, inner) => {
    let cleaned = attrs.replace(/\s*target=["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*rel=["'][^"']*["']/gi, '');
    return `<a${cleaned} target="_blank" rel="noopener noreferrer">桃 Google繝槭ャ繝・/a>`;
  });

  // --- 霑ｽ蜉: 繝悶Λ繧ｦ繧ｶ迺ｰ蠅・〒縺ｯ DOMParser 繧剃ｽｿ縺｣縺ｦ螟夜Κ繝ｪ繝ｳ繧ｯ繧偵き繝ｼ繝峨↓螟画鋤 ---
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
            // 譌｢縺ｫ蜷後§ href 縺ｮ external-link 縺・container 蜀・↓縺ゅｌ縺ｰ驥崎､・ｽ懈・繧偵せ繧ｭ繝・・
              try {
                const existing = doc.querySelector(`a.external-link[href="${href}"]`);
                if (existing) {
                  if (a.dataset) a.dataset.previewApplied = '1';
                  return;
                }
              } catch (e) { }


            // ext-inner 繧剃ｽ懊▲縺ｦ蜀・Κ繧呈ｧ狗ｯ・            const wrapper = doc.createElement('div');
            wrapper.className = 'ext-inner';

            // 繝輔ぃ繝薙さ繝ｳ縺ｯ陦ｨ遉ｺ縺励↑縺・ｼ育怐逡･・・ meta 縺ｮ縺ｿ菴懈・
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

            // wrapper 縺ｮ鬆・ｺ・ 繝｡繧ｿ縺ｮ縺ｿ・医ヵ繧｡繝薙さ繝ｳ縺ｪ縺暦ｼ・            wrapper.appendChild(meta);

            // 霑ｽ蜉: 螟夜Κ諢溘ｒ遉ｺ縺吝ｰ上＆縺ｪ遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定ｿｽ蜉
            const arrow = doc.createElement('span');
            arrow.className = 'ext-arrow';
            arrow.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>`;
            wrapper.appendChild(arrow);

            // 繧｢繝ｳ繧ｫ繝ｼ閾ｪ菴薙ｒ螟夜Κ繝ｪ繝ｳ繧ｯ陦ｨ遉ｺ縺ｫ隱ｿ謨ｴ
            a.innerHTML = '';
            a.appendChild(wrapper);
            // preserve existing classes and add external-link
            a.className = (a.className ? a.className + ' external-link' : 'external-link');
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            // 螟画鋤貂医∩繝輔Λ繧ｰ繧剃ｻ倅ｸ趣ｼ医け繝ｩ繧､繧｢繝ｳ繝亥・蜃ｦ逅・・驥崎､・ｒ驕ｿ縺代ｋ縺溘ａ・・            a.setAttribute('data-preview-applied', '1');
          }
        } catch (e) {
          // 蛟句挨繧｢繝ｳ繧ｫ繝ｼ縺ｮ螟画鋤繧ｨ繝ｩ繝ｼ縺ｯ辟｡隕・        }
      });
      // --- 霑ｽ蜉: 繧ｵ繝ｼ繝仙・縺ｧ蜷御ｸ href 縺ｮ external-link 繧帝㍾隍・炎髯､ ---
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

      // 繧ｷ繝ｪ繧｢繝ｩ繧､繧ｺ縺励※謌ｻ縺・      newHtml = doc.body.innerHTML;// 繧ｷ繝ｪ繧｢繝ｩ繧､繧ｺ縺励※謌ｻ縺・      newHtml = doc.body.innerHTML;
    }
  } catch (e) {
    // DOMParser 邉ｻ縺ｮ繧ｨ繝ｩ繝ｼ縺ｯ辟｡隕悶＠縺ｦ蜈・・ newHtml 繧定ｿ斐☆
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


// 逶ｮ谺｡(Toc)繧ｳ繝ｳ繝昴・繝阪Φ繝・const TocContainer = styled.nav`
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
  font-size: 1.0rem; /* 蝓ｺ譛ｬ繝輔か繝ｳ繝医ｒ蟆上＆繧√↓隱ｿ謨ｴ */
  line-height: 1.7;
  font-family: 'Rounded Mplus 1c', 'Noto Sans JP', 'Meiryo', 'Hiragino Maru Gothic Pro', Arial, sans-serif;

  /* 譛ｬ譁・・繝ｪ繝ｳ繧ｯ縺ｮ謚倥ｊ霑斐＠縺ｨ譛螟ｧ蟷・宛蠕｡ */
  a {
    overflow-wrap: anywhere;
    word-break: break-word;
    display: inline-block;
    max-width: 100%;
  }

  /* 繝ｪ繝ｳ繧ｯ繝励Ξ繝薙Η繝ｼ逕ｨ繧ｹ繧ｿ繧､繝ｫ */
  .link-preview {
    display: flex;
    gap: 0.8em;
    align-items: center;
    border: 1px solid #e6f4ea;
    background: transparent;
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
    background: transparent;
  }
  .link-preview .lp-title {
    font-weight: 700;
    color: ${theme.colors.primary};
    font-size: 0.92rem;
    line-height: 1.2;
  }

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ逕ｨ縺ｮ繧ｫ繝ｼ繝芽｡ｨ遉ｺ */
  .external-link_obsolete {
    display: block; /* anchor 繧偵ヶ繝ｭ繝・け縺ｫ縺励※讓ｪ蟷・＞縺｣縺ｱ縺・・繧ｫ繝ｼ繝峨↓縺吶ｋ */
    border: 1px solid #e9f5ef;
    background: linear-gradient(180deg,#ffffff,#f8fff8);
    padding: 0.45rem 0.6rem;
    border-radius: 10px;
    margin: 0.6rem 0;
    text-decoration: none;
    color: inherit;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    width: 100%;
    box-sizing: border-box; /* 縺ｯ縺ｿ蜃ｺ縺鈴亟豁｢ */
    overflow: hidden;
  }
  .external-link_obsolete:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,128,64,0.08); }

  /* 蜀・Κ繧ｳ繝ｳ繝・リ繧呈ｨｪ荳ｦ縺ｳ縺ｫ縺吶ｋ・亥ｷｦ: favicon縲∝承: meta・・*/
  .external-link_obsolete .ext-inner{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    padding-right: 28px; /* 蜿ｳ遶ｯ縺ｮ遏｢蜊ｰ蛻・・菴咏區繧堤｢ｺ菫晢ｼ医ヵ繧｡繝薙さ繝ｳ辟｡縺励〒蟆代＠蟆上＆繧・ｼ・*/
  }
  .external-link_obsolete .ext-meta { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
  .external-link_obsolete .ext-title { font-weight: 700; color: ${theme.colors.primary}; font-size: 0.95rem; white-space: normal; overflow: visible; word-break: break-word; }
  .external-link_obsolete .ext-domain { font-size: 0.75rem; color: ${theme.colors.text}99; margin-top: 0.18rem; white-space: normal; color: ${theme.colors.text}88; }

  /* 繝｢繝舌う繝ｫ・亥ｰ上＆縺・判髱｢・峨〒縺ｮ謚倩ｿ斐＠蟇ｾ蠢・*/
  @media (max-width: 600px) {
    .external-link_obsolete {
      padding: 0.36rem 0.5rem;
      gap: 0.6rem;
      align-items: flex-start;
      /* ext-inner 縺梧釜繧願ｿ斐☆ */
    }
    .external-link_obsolete .ext-favicon {
      width: 28px !important;
      height: 28px !important;
    }
    .external-link_obsolete .ext-meta { min-width: 0; }
    .external-link_obsolete .ext-title {
      white-space: normal; /* 謚倥ｊ霑斐☆ */
      font-size: 0.92rem;
      line-height: 1.2;
      overflow: visible;
    }
    .external-link_obsolete .ext-domain {
      white-space: normal;
      word-break: break-all; /* 繝峨Γ繧､繝ｳ縺碁聞縺・ｴ蜷医↓謚倥ｊ霑斐☆ */
      color: ${theme.colors.text}88;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ・ｽ・ｽ繧√↓ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
  @media (max-width: 600px) {
    .external-link_obsolete .ext-arrow {
      right: 10px;
      width: 14px;
      height: 14px;
    }
  }

  /* 譌｢蟄倥せ繧ｿ繧､繝ｫ邯夊｡・*/
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

  /* 譛ｬ譁・・逕ｻ蜒上ｒ繧ｳ繝ｳ繝・リ蜀・↓蜿弱ａ繧・*/
  img.cms-image,
  .cms-image {
    border-radius: 16px;
    width: 100% !important;
    max-width: 920px !important;
    height: auto !important;
    object-fit: contain;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    margin: 1.6em auto;
    display: block;
    background: transparent;
    padding: 0;
  }

  /* 讓ｪ髟ｷ繧ｫ繝ｼ繝峨ｒ遒ｺ螳溘↓縺吶ｋ縺溘ａ縺ｮ蠕ｮ隱ｿ謨ｴ */
  .external-link_obsolete {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    position: relative; /* 遏｢蜊ｰ繧堤ｵｶ蟇ｾ驟咲ｽｮ縺ｧ蜿ｳ遶ｯ荳ｭ螟ｮ縺ｫ縺吶ｋ縺溘ａ */
  }

  /* 繧ｿ繝悶Ξ繝・ヨ縺ｧ蟆代＠謗ｧ縺医ａ縺ｫ */
  @media (max-width: 900px) {
    img,
    .cms-image {
      width: calc(100% + 80px) !important;
      margin: 1.4em -16px;
    }
  }

  /* 繝｢繝舌う繝ｫ縺ｧ縺ｯ逕ｻ蜒上ｒ蟆代＠縺ｯ縺ｿ蜃ｺ縺輔○縺ｦ逶ｮ遶九◆縺帙▽縺､荳ｭ螟ｮ蟇・○ */
  @media (max-width: 600px) {
    font-size: 1.02rem; /* 繝｢繝舌う繝ｫ縺ｧ繧ょｰ代＠蟆上＆繧√↓ */
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

  /* 霑ｽ蜉: 螟夜Κ繝ｪ繝ｳ繧ｯ繧ｫ繝ｼ繝峨↓遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ */
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
    pointer-events: none; /* 繧｢繧､繧ｳ繝ｳ閾ｪ菴薙・繧ｯ繝ｪ繝・け蟇ｾ雎｡縺ｫ縺励↑縺・ｼ医い繝ｳ繧ｫ繝ｼ蜈ｨ菴薙′繝ｪ繝ｳ繧ｯ・・*/
  }
  .external-link_obsolete .ext-arrow svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
    vector-effect: non-scaling-stroke;
  }
  /* 繝｢繝舌う繝ｫ逕ｨ: 遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧貞ｰ上＆縺・*/
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
  background: transparent;
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
  font-size: 1.2rem; // 蟆上＆繧√↓螟画峩
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.medium};
`;
const ArticleImageEyeCatch = styled.img`
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.13);
  background: transparent;
  margin-bottom: 1.5em;
`;
// 蟆上＆縺剰｡ｨ遉ｺ縺吶ｋ譌･莉倥さ繝ｳ繝昴・繝阪Φ繝茨ｼ医い繧､繧ｭ繝｣繝・メ荳翫↓蜿ｳ蟇・○縺ｧ繧ｪ繝ｼ繝舌・繝ｬ繧､陦ｨ遉ｺ・・const ArticleDate = styled.div`
  font-size: 0.65rem; /* 縺九↑繧雁ｰ上＆縺・*/
  color: #444;
  text-align: right;
  position: absolute;
  top: 8px; /* 繧｢繧､繧ｭ繝｣繝・メ蜿ｳ荳翫↓驟咲ｽｮ */
  right: 10px;
  background: rgba(255,255,255,0.85);
  padding: 0.12rem 0.4rem;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  z-index: 6;
`;

// 霑ｽ蜉: 繧｢繧､繧ｭ繝｣繝・メ荳翫↓陦ｨ遉ｺ縺吶ｋ繧ｿ繧ｰ縺ｮ繧ｳ繝ｳ繝・リ縺ｨ繝舌ャ繧ｸ
// ・郁ｨ倅ｺ九・繝ｼ繧ｸ縺ｧ縺ｯ繧ｿ繧ｰ陦ｨ遉ｺ荳崎ｦ√・縺溘ａ蜑企勁・・
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

// 髢｢騾｣險倅ｺ九Μ繧ｹ繝・const RelatedSection = styled.div`
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
  width: 640px; /* 讓ｪ蟷・ｒ蠎・￡繧・*/
  max-width: calc(100% - 40px);
  min-height: 130px; /* 邵ｦ縺ｫ蟆代＠蠎・￡繧・*/
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
  width: 44%; /* 逕ｻ蜒丞ｹ・ｒ螟ｧ縺阪￥縺励※逶ｮ遶九◆縺帙ｋ */
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
  word-break: break-word; /* 髟ｷ縺・腰隱槭ｒ謚倥ｊ霑斐☆ */
  white-space: normal; /* 謚倥ｊ霑斐＠險ｱ蜿ｯ */
`;

const ArticlePage = (props) => {
  useAdsenseScript();
  const adRef = useRef(null);
  const id = props.id;
  // undefined = 譛ｪ蜿門ｾ暦ｼ・oading・峨｛bject = 蜿門ｾ玲ｸ医・null = 蜿門ｾ怜､ｱ謨暦ｼ郁ｦ九▽縺九ｉ縺ｪ縺・ｼ・
  const [cmsArticle, setCmsArticle] = React.useState(undefined);
  // microCMS 縺ｮ險倅ｺ九Μ繧ｹ繝茨ｼ磯未騾｣險倅ｺ区歓蜃ｺ逕ｨ・・  const [cmsArticlesList, setCmsArticlesList] = React.useState([]);
  // 繧｢繧､繧ｭ繝｣繝・メ逕ｻ蜒上・邵ｦ讓ｪ蛻､螳壹ヵ繝・け縺ｯ蠢・★蜻ｼ縺ｶ
  const [isVertical, setIsVertical] = React.useState(false);
  // post縺ｯuseMemo縺ｧ蜿門ｾ励＆繧後ｋ縺溘ａ縲（mageUrl縺ｯ豈主屓險育ｮ・  const post = useMemo(() => {
    // 縺ｾ縺壹Ο繝ｼ繧ｫ繝ｫ險倅ｺ九ｒ謗｢縺・    const local = blogPosts.find(p => p.slug === id || p.id === id);
    if (local) return local;
    // 繝ｭ繝ｼ繧ｫ繝ｫ縺ｫ辟｡縺代ｌ縺ｰ microCMS險倅ｺ具ｼ・PI縺ｧ蜿門ｾ礼ｵ先棡・峨ｒ霑斐☆
    return cmsArticle;
  }, [id, cmsArticle]);
  const imageUrl = post?.image?.url || post?.image;

  // ref: 譛ｬ譁・さ繝ｳ繝・リ繧堤峩謗･謫堺ｽ懊＠縺ｦ繝ｪ繝ｳ繧ｯ繝励Ξ繝薙Η繝ｼ謖ｿ蜈･
  const articleContentRef = useRef(null);

  React.useEffect(() => {
    // 繝輔ャ繧ｯ縺ｯ蠢・★蜻ｼ縺ｰ繧後ｋ・域擅莉ｶ蛻・ｲ舌↑縺暦ｼ・    if (!imageUrl) {
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

  // --- 霑ｽ蜉: 險倅ｺ九・蜈ｬ髢区律 / 菴懈・譌･ 繧貞ｮ牙・縺ｫ諡ｾ縺｣縺ｦ譌･譛ｬ繝ｭ繧ｱ繝ｼ繝ｫ縺ｧ謨ｴ蠖｢ ---
  const publishedRaw = post?.publishedAt || post?.createdAt || post?.date || post?.published;
  const publishedDate = publishedRaw
    ? new Date(publishedRaw).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : null;

  // 逶ｮ谺｡縺ｨid莉倥″HTML逕滓・・・seEffect繧医ｊ蜑阪↓螳夂ｾｩ縺励※縺翫￥・・  const { toc, html: contentWithIds } = useMemo(() => generateTocAndContent(post?.content), [post]);

  useEffect(() => {
    window.scrollTo(0, 0);
    // 繝ｭ繝ｼ繧ｫ繝ｫ險倅ｺ九′縺ｪ縺代ｌ縺ｰmicroCMS API縺ｧ蜿門ｾ暦ｼ域悴蜿門ｾ励ヵ繝ｩ繧ｰ繧偵そ繝・ヨ・・    const local = blogPosts.find(p => p.slug === id || p.id === id);
    if (!local) {
      setCmsArticle(undefined); // loading
      fetchArticleById(id).then(data => setCmsArticle(data)).catch(() => setCmsArticle(null));
    } else {
      // 繝ｭ繝ｼ繧ｫ繝ｫ險倅ｺ九′縺ゅｋ蝣ｴ蜷医・ CMS 蛛ｴ縺ｮ迥ｶ諷九ｒ繧ｯ繝ｪ繧｢
      setCmsArticle(null);
    }
    // 髢｢騾｣險倅ｺ区歓蜃ｺ縺ｮ縺溘ａ microCMS 縺ｮ荳隕ｧ繧貞叙蠕暦ｼ郁ｻｽ驥擾ｼ・    fetchArticles().then(data => {
      if (data && Array.isArray(data.contents)) {
        setCmsArticlesList(data.contents);
      }
    }).catch(() => {});
  }, [id]);

  // 險倅ｺ区悽譁・・ HTML 縺ｫ蜷ｫ縺ｾ繧後ｋ繝ｪ繝ｳ繧ｯ繧呈､懷・縺励∝酔荳繧ｵ繧､繝亥・縺ｮ險倅ｺ九Μ繝ｳ繧ｯ縺ｪ繧峨・繝ｬ繝薙Η繝ｼ縺ｫ鄂ｮ謠帙☆繧・  useEffect(() => {
    if (!articleContentRef.current) return;
    const container = articleContentRef.current;

    // 繝・ヰ繝・げ: contentWithIds 縺ｮ荳ｭ霄ｫ・磯聞縺包ｼ峨ｒ陦ｨ遉ｺ
    try {
      // eslint-disable-next-line no-console
      console.log('[ArticlePage] contentWithIds length:', contentWithIds ? String(contentWithIds.length) : 'null/undefined');
    } catch (e) {}

    const processAnchors = () => {
      const anchors = Array.from(container.querySelectorAll('a'));
      if (!anchors.length) return;

      anchors.forEach(a => {
        try {
          // 譌｢縺ｫ螟画鋤貂医∩縺ｪ繧我ｽ輔ｂ縺励↑縺・ｼ・ata 螻樊ｧ繝ｻ繧ｯ繝ｩ繧ｹ繝ｻ蜀・Κ讒矩縺ｮ縺・★繧後°縺ｧ蛻､螳夲ｼ・          if (a.dataset && a.dataset.previewApplied) return; // 譌｢縺ｫ蜃ｦ逅・ｸ医∩
          if (a.classList && (a.classList.contains('external-link') || a.classList.contains('link-preview'))) {
            // 螳牙・縺ｮ縺溘ａ繝輔Λ繧ｰ繧偵そ繝・ヨ
            if (a.dataset && !a.dataset.previewApplied) a.dataset.previewApplied = '1';
            return;
          }
          if (a.querySelector && (a.querySelector('.ext-inner') || a.querySelector('.link-preview'))) {
            if (a.dataset && !a.dataset.previewApplied) a.dataset.previewApplied = '1';
            return;
          }
          const href = a.getAttribute('href');
          if (!href) return;

          // 繝・ヰ繝・げ
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
            // 蜀・Κ繝励Ξ繝薙Η繝ｼ
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
            // 螟夜Κ繝ｪ繝ｳ繧ｯ
            const isHttp = /^https?:/.test(url.protocol);
            const isSameOrigin = url.origin === window.location.origin;
            if (isHttp && !isSameOrigin) {
              const domain = url.hostname.replace(/^www\./, '');

              const wrapper = document.createElement('div');
              wrapper.className = 'ext-inner';

              // 繝輔ぃ繝薙さ繝ｳ縺ｯ陦ｨ遉ｺ縺励↑縺・ｼ育怐逡･・峨Ｎeta 縺ｮ縺ｿ菴懈・縲・              const meta = document.createElement('div');
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

              // 霑ｽ蜉: 螟夜Κ諢溘ｒ遉ｺ縺吝ｰ上＆縺ｪ遏｢蜊ｰ繧｢繧､繧ｳ繝ｳ繧定ｿｽ蜉
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

    // 蛻晏屓螳溯｡・    processAnchors();
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
    


    // --- 霑ｽ蜉: 繧ｯ繝ｩ繧､繧｢繝ｳ繝亥・縺ｧ蛻・屬縺励※縺・ｋ .ext-inner 縺ｨ髫｣謗･縺吶ｋ a.external-link 繧堤ｵｱ蜷医☆繧・---
    

    // --- 霑ｽ蜉: 繝・く繧ｹ繝医□縺代・ a.external-link・・RL縺昴・繧ゅ・繧定｡ｨ遉ｺ縺励※縺・ｋ繧ゅ・・峨ｒ髱櫁｡ｨ遉ｺ縺ｫ縺吶ｋ ---
    





    // --- 霑ｽ蜉: 繧ｯ繝ｩ繧､繧｢繝ｳ繝亥・縺ｧ蛻・屬縺励※縺・ｋ .ext-inner 縺ｨ髫｣謗･縺吶ｋ a.external-link 繧堤ｵｱ蜷医☆繧・---
    

    // --- 霑ｽ蜉: 繝・く繧ｹ繝医・縺ｿ縺ｮ a.external-link 繧帝撼陦ｨ遉ｺ縺ｫ縺吶ｋ・・RL縺縺代・繧ゅ・・・---
    




    // MutationObserver 縺ｧ驕・ｻｶ謖ｿ蜈･縺輔ｌ繧九Μ繝ｳ繧ｯ縺ｫ蟇ｾ蠢懊☆繧・    let observer = null;
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
          // 蟆上＆縺ｪ驕・ｻｶ縺ｧ蜀榊・逅・          setTimeout(()=>{ processAnchors(); window.mergeSeparatedExtInner && window.mergeSeparatedExtInner(); window.hideTextOnlyExternalAnchors && window.hideTextOnlyExternalAnchors(); }, 50);
        }
      });
      observer.observe(container, { childList: true, subtree: true });
    } catch (e) {
      // 隕ｳ貂ｬ縺ｫ螟ｱ謨励＠縺ｦ繧ょ撫鬘後↑縺・    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [contentWithIds, cmsArticlesList]);

  // AdSense蠎・相縺ｮ蛻晄悄蛹・  useEffect(() => {
    if (window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {}
    }
  }, [id]);
  // microCMS險倅ｺ九〒繧る未騾｣險倅ｺ九ｒ陦ｨ遉ｺ・医Ο繝ｼ繧ｫ繝ｫ+CMS荳｡譁ｹ縺九ｉ謚ｽ蜃ｺ・・  const allArticles = [
    ...blogPosts,
    ...cmsArticlesList
  ];
  // 豁｣隕丞喧縺励◆繧ｫ繝・ざ繝ｪ蜷阪ｒ霑斐☆繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ
  function getCategoryName(a) {
    if (!a) return undefined;
    if (a.category && typeof a.category === 'object') return a.category.name;
    return a.category;
  }
  // 迴ｾ蝨ｨ縺ｮ謚慕ｨｿ縺ｮ豁｣隕上き繝・ざ繝ｪ蜷・  const currentCatName = getCategoryName(post);
  // slug/id 繧呈枚蟄怜・蛹・  const postSlug = post?.slug ? String(post.slug) : String(post?.id || '');
  const related = allArticles.filter(p => {
    const pSlug = p.slug ? String(p.slug) : String(p.id || '');
    // 繧ｫ繝・ざ繝ｪ蜷阪′蜷後§縲√°縺､閾ｪ霄ｫ莉･螟・    return getCategoryName(p) === currentCatName && pSlug !== postSlug;
  });

  // 繝ｭ繝ｼ繧ｫ繝ｫ險倅ｺ九ｂ縺ｪ縺上√∪縺 CMS 縺九ｉ縺ｮ蜿門ｾ励′邨ゅｏ縺｣縺ｦ縺・↑縺・ｴ蜷医・菴輔ｂ陦ｨ遉ｺ縺励↑縺・ｼ医ヵ繝ｩ繝・す繝･髦ｲ豁｢・・  const hasLocal = blogPosts.find(p => p.slug === id || p.id === id);
  if (!post) {
    if (!hasLocal && cmsArticle === undefined) {
      // loading: 陦ｨ遉ｺ繧貞・縺輔★繝輔Λ繝・す繝･繧帝亟豁｢
      return null;
    }
    // 蜿門ｾ玲ｸ医∩縺縺悟ｭ伜惠縺励↑縺・ｴ蜷医・繝｡繝・そ繝ｼ繧ｸ陦ｨ遉ｺ
    return <ArticleContainer>險倅ｺ九′隕九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・/ArticleContainer>;
  }


  return (
    <>
  {/* EyeCatch蜑企勁: 險倅ｺ九＃縺ｨ縺ｮ逕ｻ蜒上・縺ｿ陦ｨ遉ｺ */}
      <ArticleContainer>
        <ArticleTitle>{post.title}</ArticleTitle>
        <div style={{display:'flex', justifyContent:'center', position: 'relative'}}>
          {/* 譌･莉倥ｒ逕ｻ蜒上・荳翫∝承蟇・○縺ｧ繧ｪ繝ｼ繝舌・繝ｬ繧､陦ｨ遉ｺ */}
          {publishedDate && (
            <ArticleDate>
              {publishedDate} 縺ｫ蜈ｬ髢・            </ArticleDate>
          )}
          <ArticleImageEyeCatch src={imageUrl} alt={post.title} className={isVertical ? 'vertical' : ''} />
        </div>
        {/* 逶ｮ谺｡ */}
        {toc.length > 0 && (
          <TocContainer aria-label="逶ｮ谺｡">
            <strong style={{color:'#1B5E20'}}>逶ｮ谺｡</strong>
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
        {/* Google AdSense in-article蠎・相繝ｦ繝九ャ繝・*/}
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
            <RelatedTitle><FaLink /> 髢｢騾｣繝壹・繧ｸ</RelatedTitle>
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
          <FaArrowLeft /> 繝医ャ繝励・繝ｼ繧ｸ縺ｸ謌ｻ繧・        </BackLink>
      </ArticleContainer>
    </>
  );
};

export default ArticlePage;
