// frontend/src/utils/api.jsx

// ------------------------------------
// クイズモードの定義
// ------------------------------------
export const MODES = [
  { question: "chinese", answer: "translation", label: "中国語→日本語" }, // 中国語→日本語
  { question: "chinese", answer: "pinyin", label: "中国語→ピンイン" },   // 中国語→ピンイン
  { question: "translation", answer: "chinese", label: "日本語→中国語" }, // 日本語→中国語
  { question: "translation", answer: "pinyin", label: "日本語→ピンイン" }, // 日本語→ピンイン
  { question: "pinyin", answer: "chinese", label: "ピンイン→中国語" },    // ピンイン→中国語
  { question: "pinyin", answer: "translation", label: "ピンイン→日本語" }, // ピンイン→日本語
];

// ------------------------------------
// 認証付き fetch 関数
// API へのリクエストに自動で JWT を付与
// ------------------------------------
export function authFetch(url, options = {}) {
  // localStorage から保存されているトークンを取得
  const token = localStorage.getItem("token");

  // ヘッダー設定
  const headers = {
    ...(options.headers || {}),               // 既存ヘッダーを展開
    "Content-Type": "application/json",      // JSON 送信を指定
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // トークンがある場合は Authorization ヘッダーを追加
  };

  // fetch 実行
  return fetch(url, { ...options, headers }).then(async (res) => {
    // 認証エラーの場合は localStorage の token を削除して例外を投げる
    if (res.status === 401) {
      localStorage.removeItem("token"); // 不正トークン削除
      throw new Error("Unauthorized");  // Unauthorized 例外
    }
    return res; // 成功時は fetch のレスポンスを返す
  });
}
