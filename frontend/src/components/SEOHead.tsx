import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'CountdownHub - 日本全国のイベントカウントダウンタイマー',
  description = '日本全国のイベントをカウントダウンタイマーで管理。コンサート、展示会、スポーツイベントなど様々なイベントの開催日時を一目で確認できます。',
  keywords = 'イベント,カウントダウン,タイマー,コンサート,展示会,スポーツ,日本,開催日時,イベント情報',
  ogTitle,
  ogDescription,
  ogImage = '/og-image.png',
  ogUrl = 'https://countdown-hub.web.app/',
  canonicalUrl,
  structuredData
}) => {
  useEffect(() => {
    // ページタイトルを更新
    document.title = title;
    
    // メタタグを更新
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // OGPタグを更新
    updateMetaProperty('og:title', ogTitle || title);
    updateMetaProperty('og:description', ogDescription || description);
    updateMetaProperty('og:image', ogImage);
    updateMetaProperty('og:url', ogUrl);
    
    // Twitter Cardを更新
    updateMetaName('twitter:title', ogTitle || title);
    updateMetaName('twitter:description', ogDescription || description);
    updateMetaName('twitter:image', ogImage);
    
    // カノニカルURLを更新
    if (canonicalUrl) {
      updateCanonicalUrl(canonicalUrl);
    }
    
    // 構造化データを更新
    if (structuredData) {
      updateStructuredData(structuredData);
    }
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, canonicalUrl, structuredData]);

  return null;
};

const updateMetaTag = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
};

const updateMetaProperty = (property: string, content: string) => {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
};

const updateMetaName = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
};

const updateCanonicalUrl = (url: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
};

const updateStructuredData = (data: object) => {
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript && existingScript.id === 'dynamic-structured-data') {
    existingScript.remove();
  }
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'dynamic-structured-data';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};