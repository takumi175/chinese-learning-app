// frontend/src/App.jsx

// React のフックをインポート
import { useState, useEffect } from "react";

// 認証付き fetch 関数をインポート
import { authFetch } from "./utils/api";

// 認証コンポーネントとクイズコンポーネントをインポート
import Auth from "./components/Auth";
import QuizApp from "./components/QuizApp";

// ------------------------------------
// メインアプリコンポーネント
// ------------------------------------
export default function App() {
  // 現在ログイン中のユーザー名を保持する state
  const [user, setUser] = useState(null);

  // 読み込み中かどうかを判定する state
  const [loading, setLoading] = useState(true);

  // 環境変数から API の URL を取得
  const API_URL = import.meta.env.VITE_API_URL;

  // トークンが期限切れの場合の処理（ユーザー情報をクリア）
  const handleExpired = () => setUser(null);

  // コンポーネントマウント時にログイン状態をチェック
  useEffect(() => {
    // localStorage から保存されているトークンを取得
    const token = localStorage.getItem("token");

    // トークンがない場合はログインしていないと判断して読み込み完了
    if(!token){
      setLoading(false);
      return;
    }

    // 認証付き API でユーザー情報を取得
    authFetch(`${API_URL}/api/me`)
      .then(r => r.json()) // JSON に変換
      .then(data => {
        // ログインしていればユーザー名をセット
        if(data.logged_in) setUser(data.username);
      })
      .catch(() => setUser(null)) // エラー時はユーザー情報クリア
      .finally(() => setLoading(false)); // 読み込み完了
  }, [API_URL]);

  // 読み込み中はメッセージを表示
  if(loading) return <p>読み込み中...</p>;

  // ユーザーがログインしていれば QuizApp を表示、未ログインなら Auth コンポーネントを表示
  return user
    ? <QuizApp user={user} onExpired={handleExpired} />
    : <Auth onLogin={setUser} />;
}
