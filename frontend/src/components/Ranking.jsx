// frontend/src/components/Ranking.jsx

// ReactとMaterial UIのコンポーネントをインポート
import React, { useState, useEffect } from "react";
import { MODES, authFetch } from "../utils/api"; // クイズモード情報と認証付きfetch関数
import {
  Box,              // ページ全体のコンテナ
  Typography,       // テキスト表示
  Select,           // ドロップダウン選択
  MenuItem,         // ドロップダウン項目
  FormControl,      // 入力フォームラップ
  InputLabel,       // フォームラベル
  Table,            // テーブル
  TableHead,        // テーブルヘッダー
  TableBody,        // テーブルボディ
  TableRow,         // テーブル行
  TableCell,        // テーブルセル
  TableContainer,   // テーブルラップ（スクロール用）
  Paper,            // 紙のような背景
  Stack,            // 縦横レイアウト
  Button            // ボタン
} from "@mui/material";

// Rankingコンポーネント定義
export default function Ranking({ onBack }) {
  const [ranking, setRanking] = useState([]);          // ランキングデータ
  const [loading, setLoading] = useState(true);        // 読み込み中フラグ
  const [selectedRanking, setSelectedRanking] = useState("total"); // "mode" or "total" 選択
  const [modeIndex, setModeIndex] = useState(0);       // 選択中モード
  const [quizType, setQuizType] = useState("choice");  // クイズタイプ ("choice" or "input")
  const API_URL = import.meta.env.VITE_API_URL;        // APIのベースURL

  // 初回レンダリング時にランキング取得
  useEffect(() => {
    authFetch(`${API_URL}/api/ranking`) // 認証付きfetch
      .then(r => r.json())              // JSONに変換
      .then(data => setRanking(data))   // stateにセット
      .finally(() => setLoading(false));// ローディング終了
  }, [API_URL]);

  // 読み込み中表示
  if (loading) return <Typography align="center">読み込み中...</Typography>;

  const modeKey = `${modeIndex}-${quizType}`; // 現在モード用のキー

  // 指定ユーザーの現在モードスコアを取得
  const getModeScore = (user) => {
    if (!user.scores) return 0;
    return Object.values(user.scores).reduce(
      (sum, startScores) => sum + (startScores[modeKey] || 0),
      0
    );
  };

  // モード別ランキング（降順ソート）
  const modeRanking = [...ranking].sort((a,b)=>getModeScore(b)-getModeScore(a));
  // 総合ランキング（降順ソート）
  const totalRanking = [...ranking].sort((a,b)=>b.totalScore - a.totalScore);

  // 表示するランキングを選択
  const displayRanking = selectedRanking === "mode" ? modeRanking : totalRanking;

  // ランキングタイトル
  const rankingTitle = selectedRanking === "mode"
    ? `${MODES[modeIndex].label} (${quizType === "choice" ? "4択" : "入力"}) ランキング`
    : "全モード合計ランキング";

  return (
    // ページ全体コンテナ
    <Box sx={{ minHeight: "100vh", p: 2, bgcolor: "#f5f5f5" }}>
      <Stack spacing={2} maxWidth={600} mx="auto">
        {/* タイトル */}
        <Typography variant="h4" align="center">ランキング</Typography>

        {/* ランキング選択フォーム */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="center">
          <FormControl sx={{ width: 180 }}>
            <InputLabel>表示ランキング</InputLabel>
            <Select
              value={selectedRanking}
              label="表示ランキング"
              onChange={e => setSelectedRanking(e.target.value)}
            >
              <MenuItem value="mode">モード別合計</MenuItem>
              <MenuItem value="total">全モード合計</MenuItem>
            </Select>
          </FormControl>

          {/* モード選択はモード別ランキング表示時のみ */}
          {selectedRanking === "mode" && (
            <>
              <FormControl sx={{ width: 180 }}>
                <InputLabel>出題形式</InputLabel>
                <Select
                  value={modeIndex}
                  label="出題形式"
                  onChange={e => setModeIndex(parseInt(e.target.value))}
                >
                  {MODES.map((m,i) => <MenuItem key={i} value={i}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl sx={{ width: 180 }}>
                <InputLabel>学習モード</InputLabel>
                <Select
                  value={quizType}
                  label="学習モード"
                  onChange={e => setQuizType(e.target.value)}
                >
                  <MenuItem value="choice">4択</MenuItem>
                  <MenuItem value="input">入力</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </Stack>

        {/* ランキングタイトル表示 */}
        <Typography variant="h6" align="center" sx={{ mt: 2 }}>
          {rankingTitle}
        </Typography>

        {/* ランキングテーブル */}
        <TableContainer component={Paper} sx={{ maxHeight: 350, mx: "auto", width: "100%" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ px: 2, py: 1 }}>順位</TableCell>
                <TableCell align="center" sx={{ px: 2, py: 1 }}>ユーザー</TableCell>
                <TableCell align="center" sx={{ px: 2, py: 1 }}>スコア</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRanking.map((u, i) => (
                <TableRow key={i}>
                  <TableCell align="center" sx={{ px: 2, py: 1 }}>{i + 1}</TableCell>
                  <TableCell align="center" sx={{ px: 2, py: 1 }}>{u.username}</TableCell>
                  <TableCell align="center" sx={{ px: 2, py: 1 }}>
                    {selectedRanking === "mode" ? getModeScore(u) : u.totalScore}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ホームに戻るボタン */}
        <Button variant="contained" color="primary" onClick={onBack} sx={{ mt: 2 }}>
          ホームに戻る
        </Button>
      </Stack>
    </Box>
  );
}
