// frontend/src/components/WordList.jsx

// React と Material UI のコンポーネントをインポート
import React, { useState, useEffect } from "react";
import { authFetch } from "../utils/api"; // 認証付き fetch
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Stack,
  Button
} from "@mui/material";

// WordList コンポーネント定義
export default function WordList({ onBack }) {
  const [words, setWords] = useState([]);       // 単語一覧の状態
  const [loading, setLoading] = useState(true); // データ読み込み中フラグ
  const API_URL = import.meta.env.VITE_API_URL; // API の URL

  // 初期データ取得
  useEffect(() => {
    authFetch(`${API_URL}/api/words`)   // 認証付き fetch で単語一覧取得
      .then(r=>r.json())                // JSON に変換
      .then(data=>setWords(data))       // 取得した単語を state にセット
      .finally(()=>setLoading(false));  // 読み込み完了フラグを false に
  }, [API_URL]);

  // 読み込み中の場合は表示
  if (loading) return <Typography align="center">読み込み中...</Typography>;

  return (
    // ページ全体の Box コンテナ
    <Box sx={{ minHeight: "100vh", p: 2, bgcolor: "#f5f5f5" }}>
      <Stack spacing={2} maxWidth={600} mx="auto">

        {/* ページタイトル */}
        <Typography variant="h4" align="center">単語一覧</Typography>

        {/* 単語テーブル */}
        <TableContainer component={Paper} sx={{ maxHeight: 450, mx: "auto", width: "100%" }}>
          <Table stickyHeader>
            {/* テーブルヘッダー */}
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ px: 2, py: 1 }}>ID</TableCell>
                <TableCell align="center" sx={{ px: 2, py: 1 }}>中国語</TableCell>
                <TableCell align="center" sx={{ px: 2, py: 1 }}>ピンイン</TableCell>
                <TableCell align="center" sx={{ px: 2, py: 1 }}>日本語</TableCell>
              </TableRow>
            </TableHead>

            {/* テーブルボディ */}
            <TableBody>
              {words.map((w) => (
                <TableRow key={w.id}>
                  <TableCell align="center" sx={{ px: 2, py: 1 }}>{w.id}</TableCell>
                  <TableCell align="center" sx={{ px: 2, py: 1 }}>{w.chinese}</TableCell>
                  <TableCell align="center" sx={{ px: 2, py: 1 }}>{w.pinyin}</TableCell>
                  <TableCell align="center" sx={{ px: 2, py: 1 }}>{w.translation}</TableCell>
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
