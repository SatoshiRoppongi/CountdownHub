/**
 * CountdownHub フロントエンド エントリーポイント
 *
 * React アプリケーションの起動処理を担当するファイル。
 * HTML の #root 要素に React ツリーをマウントし、
 * React.StrictMode で開発時の潜在的問題を検出する。
 *
 * 主な責務:
 * - ReactDOM.createRoot による React 18 のコンカレントレンダリング初期化
 * - グローバル CSS (Tailwind CSS) の読み込み
 * - App コンポーネント (ルートコンポーネント) のマウント
 * - Web Vitals によるパフォーマンス計測の起動
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

/**
 * React 18 の createRoot API でルート要素を作成。
 * コンカレントモードが有効になり、Suspense や Transition など
 * React 18 の新機能が利用可能になる。
 */
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

/**
 * StrictMode で App をレンダリング。
 * 開発環境では以下の追加チェックが実行される:
 * - 安全でないライフサイクルメソッドの検出
 * - レガシー API の使用警告
 * - 副作用の二重呼び出しによる問題検出
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Web Vitals によるパフォーマンス計測。
 * CLS, FID, FCP, LCP, TTFB などのコアウェブバイタル指標を収集する。
 * コールバック関数を渡すことでアナリティクスエンドポイントへの送信も可能。
 * 例: reportWebVitals(console.log)
 * 詳細: https://bit.ly/CRA-vitals
 */
reportWebVitals();
