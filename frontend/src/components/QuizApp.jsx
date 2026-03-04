// frontend/src/components/QuizApp.jsx

// --- Reactの基本Hooksをインポート ---
import { useState, useEffect } from "react";

// --- APIユーティリティ関数とモード定義をインポート ---
import { MODES, authFetch } from "../utils/api";

// --- 他の画面コンポーネントをインポート ---
import QuizHome from "./QuizHome";       // クイズ開始前のホーム画面
import QuizScreen from "./QuizScreen";   // 実際のクイズ画面
import QuizResult from "./QuizResult";   // クイズ終了後の結果表示画面
import Ranking from "./Ranking";         // ランキング画面
import WordList from "./WordList";       // 単語一覧画面
import UserSettings from "./UserSettings"; // ユーザー設定画面

// --- QuizApp コンポーネント本体 ---
export default function QuizApp({ user, onExpired }) {
  const API_URL = import.meta.env.VITE_API_URL; // バックエンドAPIのURLを環境変数から取得

  // ---------------- ユーザー名を状態として管理 ----------------
  const [userName, setUserName] = useState(user);

  // ---------------- クイズ進行管理用の状態 ----------------
  const [started, setStarted] = useState(false);        // クイズ開始中かどうか
  const [quizList, setQuizList] = useState([]);         // 出題するクイズのリスト
  const [currentIndex, setCurrentIndex] = useState(0);  // 現在の問題番号
  const [selected, setSelected] = useState(null);       // ユーザーが選んだ回答
  const [results, setResults] = useState([]);           // 全問題の解答履歴
  const [currentScore, setCurrentScore] = useState(0);  // 現在のスコア
  const [sequenceStarts, setSequenceStarts] = useState([]); // クイズ開始地点の候補
  const [scores, setScores] = useState({});             // スコア履歴（モードごとに記録）
  const [currentStartId, setCurrentStartId] = useState(null); // 現在のシーケンス開始ID
  const [modeIndex, setModeIndex] = useState(1);        // 現在のモード（例: 中国語→ピンイン）
  const [quizType, setQuizType] = useState("choice");   // クイズ形式（選択式 or 入力式）
  const [orderType, setOrderType] = useState("id");     // 出題順序（順番 or ランダム）
  const [finished, setFinished] = useState(false);      // クイズ終了済みかどうか
  const [inputAnswer, setInputAnswer] = useState("");   // 入力式クイズの回答入力
  const [resultMessage, setResultMessage] = useState(""); // 「正解/不正解」のメッセージ

  // ---------------- ユーザー設定管理用の状態 ----------------
  const [showSettings, setShowSettings] = useState(false); // ユーザー設定画面の表示状態
  const [newUsername, setNewUsername] = useState("");      // ユーザー名変更用入力
  const [oldPassword, setOldPassword] = useState("");      // 古いパスワード入力
  const [newPassword, setNewPassword] = useState("");      // 新しいパスワード入力
  const [message, setMessage] = useState("");              // 設定変更後のメッセージ表示

  // ---------------- ランキング・単語一覧画面の状態 ----------------
  const [showRanking, setShowRanking] = useState(false); // ランキング画面を表示するか
  const [showWords, setShowWords] = useState(false);     // 単語一覧画面を表示するか

  // ---------------- クイズ出題モード ----------------
  const mode = MODES[modeIndex];                   // 現在選択中のモード情報
  const modeKey = `${modeIndex}-${quizType}`;      // モード+形式を組み合わせたキー（スコア保存用）
  const quiz = quizList[currentIndex] || {};       // 現在の問題（存在しなければ空オブジェクト）

  // 選択肢の種類を決定（モードに応じて中国語/ピンイン/選択肢リストを使用）
  const choices =
    mode.answer === "chinese"
      ? quiz.all_chinese
      : mode.answer === "pinyin"
      ? quiz.all_pinyin
      : quiz.choices || [];

  // ---------------- 初期データ取得（シーケンス開始IDとスコア） ----------------
  useEffect(() => {
    // クイズ開始地点の一覧を取得
    authFetch(`${API_URL}/api/quiz/sequence_ids`)
      .then((r) => r.json())
      .then((ids) => setSequenceStarts(ids))
      .catch((e) => e.message === "Unauthorized" && onExpired());

    // スコア一覧を取得
    authFetch(`${API_URL}/api/scores`)
      .then((r) => r.json())
      .then((data) => setScores(data))
      .catch((e) => e.message === "Unauthorized" && onExpired());
  }, [onExpired, API_URL]); // onExpiredとAPI_URLが変わったら再実行

  // ---------------- クイズ問題を取得 ----------------
  const fetchQuiz = (startId, allRandom = false) => {
    // 状態を初期化
    setCurrentStartId(allRandom ? "all-random" : startId);
    setCurrentScore(0);
    setResults([]);
    setFinished(false);
    setInputAnswer("");
    setSelected(null);

    // APIエンドポイントを選択（ランダム or シーケンス）
    const url = allRandom
      ? `${API_URL}/api/quiz/all_random?count=10`
      : `${API_URL}/api/quiz/sequence?start_id=${startId}`;

    // APIからクイズデータを取得
    authFetch(url)
      .then((r) => r.json())
      .then((d) => {
        let quizData = [...d]; // データをコピー
        // 出題順序がランダムならシャッフル
        if (orderType === "random") {
          for (let i = quizData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [quizData[i], quizData[j]] = [quizData[j], quizData[i]];
          }
        }
        setQuizList(quizData);    // 問題リストを保存
        setCurrentIndex(0);       // 最初の問題に戻す
        setSelected(null);        // 選択リセット
        setStarted(true);         // クイズ開始
      })
      .catch((e) => e.message === "Unauthorized" && onExpired());
  };

  // ---------------- 回答処理（正解/不正解判定） ----------------
  const handleAnswer = (choice) => {
    if (selected) return; // 既に回答済みなら処理しない

    // 正解の答えをモードに応じて取得
    const correct =
      mode.answer === "chinese"
        ? quiz.chinese
        : mode.answer === "pinyin"
        ? quiz.pinyin
        : quiz.answer;

    // 入力式ならテキスト入力を採用、選択式ならクリックした選択肢を使用
    const userChoice = quizType === "input" ? inputAnswer.trim() : choice;

    // 正解判定
    const isCorrect = userChoice === correct;

    // 選択肢を保存し、メッセージを表示
    setSelected(userChoice);
    setResultMessage(isCorrect ? "✅ 正解！" : `❌ 不正解… 正解は: ${correct}`);

    // 結果履歴に追加
    setResults((prev) => [
      ...prev,
      {
        question:
          mode.question === "chinese"
            ? quiz.chinese
            : mode.question === "pinyin"
            ? quiz.pinyin
            : quiz.answer,
        correctAnswer: correct,
        userAnswer: userChoice,
        isCorrect,
      },
    ]);

    // スコア加算
    if (isCorrect) setCurrentScore((prev) => prev + 1);

    // 次の問題に進む処理（1.3秒後に実行）
    setTimeout(() => {
      setSelected(null);
      setInputAnswer("");
      setResultMessage("");
      if (currentIndex + 1 < quizList.length) {
        setCurrentIndex((prev) => prev + 1); // 次の問題へ
      } else {
        saveScore(currentScore + (isCorrect ? 1 : 0)); // 最終スコア保存
        setStarted(false); // クイズ終了
        setFinished(true);
      }
    }, 1300);
  };

  // ---------------- 「わからない」処理 ----------------
  const handleDontKnow = () => {
    if (selected) return; // 既に回答済みなら処理しない

    // 正解取得
    const correct =
      mode.answer === "chinese"
        ? quiz.chinese
        : mode.answer === "pinyin"
        ? quiz.pinyin
        : quiz.answer;

    // ユーザー回答を「わからない」に設定
    setSelected("わからない");
    setResultMessage(`❌ 不正解… 正解は: ${correct}`);

    // 結果履歴に追加（常に不正解）
    setResults((prev) => [
      ...prev,
      {
        question:
          mode.question === "chinese"
            ? quiz.chinese
            : mode.question === "pinyin"
            ? quiz.pinyin
            : quiz.answer,
        correctAnswer: correct,
        userAnswer: "わからない",
        isCorrect: false,
      },
    ]);

    // 次の問題へ（1.2秒後）
    setTimeout(() => {
      setSelected(null);
      setInputAnswer("");
      setResultMessage("");
      if (currentIndex + 1 < quizList.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        saveScore(currentScore); // スコアは増えない
        setStarted(false);
        setFinished(true);
      }
    }, 1200);
  };

  // ---------------- スコア保存処理 ----------------
  const saveScore = (finalScore) => {
    if (!currentStartId) return; // クイズ未開始なら何もしない

    // スコアを更新
    authFetch(`${API_URL}/api/score/update`, {
      method: "POST",
      body: JSON.stringify({ start_id: currentStartId, mode: modeKey, score: finalScore }),
    })
      .then(() => authFetch(`${API_URL}/api/scores`)) // 最新のスコアを再取得
      .then((r) => r.json())
      .then((data) => setScores(data))
      .catch((e) => e.message === "Unauthorized" && onExpired());
  };

  // ---------------- ユーザー名変更処理 ----------------
  const changeUsername = () => {
    if (!newUsername.trim()) {
      setMessage("ユーザー名を入力してください");
      return;
    }
    authFetch(`${API_URL}/api/me/username`, {
      method: "PUT",
      body: JSON.stringify({ username: newUsername.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ok") {
          setMessage(`ユーザー名を ${data.username} に変更しました`);
          setUserName(data.username);
        } else {
          setMessage(data.message || "変更に失敗しました");
        }
      })
      .catch((e) => (e.message === "Unauthorized" ? onExpired() : setMessage("通信エラー")));
  };

  // ---------------- パスワード変更処理 ----------------
  const changePassword = () => {
    if (!oldPassword || !newPassword) {
      setMessage("古いパスワードと新しいパスワードを入力してください");
      return;
    }
    authFetch(`${API_URL}/api/me/password`, {
      method: "PUT",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ok") {
          setMessage("パスワードを変更しました");
          setOldPassword("");
          setNewPassword("");
        } else {
          setMessage(data.message || "変更に失敗しました");
        }
      })
      .catch((e) => (e.message === "Unauthorized" ? onExpired() : setMessage("通信エラー")));
  };

  // ---------------- ログアウト処理 ----------------
  const handleLogout = () => {
    localStorage.removeItem("token"); // ローカル保存のトークン削除
    window.location.reload();         // ページをリロード
  };

  // フロント側で deleteAccount 関数を作る例
  const deleteAccount = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/me/delete`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,  // JWTトークン
        },
      });
      const data = await res.json();
      if (data.status === "ok") {
        alert("アカウントを削除しました");
        localStorage.removeItem("token"); // ログアウト処理
        window.location.href = "/";       // ホームへ
      } else {
        alert(data.message || "削除に失敗しました");
      }
    } catch (err) {
      console.error(err);
      alert("削除中にエラーが発生しました");
    }
  };

  // ---------------- 画面切り替え処理 ----------------
  if (showSettings) {
    // ユーザー設定画面
    return (
      <UserSettings
        newUsername={newUsername}
        setNewUsername={setNewUsername}
        oldPassword={oldPassword}
        setOldPassword={setOldPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        message={message}
        changeUsername={changeUsername}
        changePassword={changePassword}
        onBack={() => setShowSettings(false)}
        onExpired={onExpired}
        deleteAccount={deleteAccount}
        handleLogout={handleLogout}
      />
    );
  }
  if (showRanking) return <Ranking onBack={() => setShowRanking(false)} />; // ランキング画面
  if (showWords) return <WordList onBack={() => setShowWords(false)} />;    // 単語一覧画面

  if (!started) {
    // クイズ未開始
    if (finished)
      // クイズ終了後の結果画面
      return (
        <QuizResult
          results={results}
          currentScore={currentScore}
          quizList={quizList}
          onBack={() => setFinished(false)}
        />
      );

    // クイズ開始前のホーム画面
    return (
      <QuizHome
        user={userName}
        scores={scores}
        sequenceStarts={sequenceStarts}
        modeIndex={modeIndex}
        setModeIndex={setModeIndex}
        quizType={quizType}
        setQuizType={setQuizType}
        orderType={orderType}
        setOrderType={setOrderType}
        fetchQuiz={fetchQuiz}
        onShowRanking={() => setShowRanking(true)}
        onShowWords={() => setShowWords(true)}
        onShowSettings={() => setShowSettings(true)} // 設定画面を開く
      />
    );
  }

  // クイズ実行中の画面
  return (
    <QuizScreen
      quiz={quiz}
      quizType={quizType}
      mode={mode}
      choices={choices}
      inputAnswer={inputAnswer}
      setInputAnswer={setInputAnswer}
      selected={selected}
      handleAnswer={handleAnswer}
      handleDontKnow={handleDontKnow}
      currentScore={currentScore}
      setStarted={setStarted}
      resultMessage={resultMessage}
      currentIndex={currentIndex}
      totalQuestions={quizList.length}
    />
  );
}
