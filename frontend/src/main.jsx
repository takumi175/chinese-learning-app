// frontend/src/main.jsx

// React 本体をインポート
import React from "react";

// ReactDOM をインポート（React 18 以降の createRoot 用）
import ReactDOM from "react-dom/client";

// メインアプリコンポーネントをインポート
import App from "./App.jsx";

// ------------------------------------
// React アプリのレンダリング処理
// ------------------------------------

// HTML の id="root" の要素に React アプリをマウント
ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode は開発時に潜在的な問題を検出するためのラッパー
  <React.StrictMode>
    {/* メインアプリコンポーネントを描画 */}
    <App />
  </React.StrictMode>
);
