// frontend/src/components/QuizHome.jsx

import React from "react";
import { MODES } from "../utils/api";
import {
  Box,
  Button,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from "@mui/material";

export default function QuizHome({
  user,
  scores,
  sequenceStarts,
  modeIndex,
  setModeIndex,
  quizType,
  setQuizType,
  orderType,
  setOrderType,
  fetchQuiz,
  onShowRanking,
  onShowWords,
  onShowSettings,
}) {
  const modeKey = `${modeIndex}-${quizType}`;

  const totalPossible = sequenceStarts.length * MODES.length * 2 * 10;

  const totalScore = Object.values(scores).reduce(
    (sum, modeScores) =>
      sum + Object.values(modeScores).reduce((s, v) => s + v, 0),
    0
  );

  const modeScore = Object.values(scores).reduce(
    (sum, modeScores) => sum + (modeScores[modeKey] || 0),
    0
  );

  const modePossible = sequenceStarts.length * 10;

  const totalPct = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
  const modePct = modePossible > 0 ? (modeScore / modePossible) * 100 : 0;

  return (
    <Box sx={{ minHeight: "100vh", p: 2, bgcolor: "#f0f4f8" }}>
      <Stack spacing={2} maxWidth={400} mx="auto">

        {/* --- ヘッダー: ユーザー情報 + ナビゲーション --- */}
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ pb: "12px !important" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {user} さん
              </Typography>
              <Button size="small" variant="outlined" onClick={onShowSettings} sx={{ borderRadius: 2 }}>
                設定
              </Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={onShowRanking}
                fullWidth
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                ランキング
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={onShowWords}
                fullWidth
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                単語一覧
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* --- スコアサマリー --- */}
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">全モード合計</Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {totalScore} / {totalPossible}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={totalPct}
              sx={{ height: 7, borderRadius: 4, mb: 1.5 }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                現モード ({MODES[modeIndex].label} / {quizType === "choice" ? "4択" : "入力"})
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {modeScore} / {modePossible}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={modePct}
              color="secondary"
              sx={{ height: 7, borderRadius: 4 }}
            />
          </CardContent>
        </Card>

        {/* --- 出題形式選択 --- */}
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 0.5, fontSize: "0.85rem" }}>出題形式</FormLabel>
              <Select
                value={modeIndex}
                onChange={(e) => setModeIndex(parseInt(e.target.value))}
                size="small"
              >
                {MODES.map((m, i) => (
                  <MenuItem key={i} value={i}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 1.5 }} />

            {/* 学習モード & 出題順序 を横並び */}
            <Stack direction="row" spacing={2}>
              <FormControl component="fieldset" sx={{ flex: 1 }}>
                <FormLabel component="legend" sx={{ fontSize: "0.85rem" }}>学習モード</FormLabel>
                <RadioGroup value={quizType} onChange={(e) => setQuizType(e.target.value)}>
                  <FormControlLabel value="choice" control={<Radio size="small" />} label="4択" />
                  <FormControlLabel value="input" control={<Radio size="small" />} label="入力" />
                </RadioGroup>
              </FormControl>
              <FormControl component="fieldset" sx={{ flex: 1 }}>
                <FormLabel component="legend" sx={{ fontSize: "0.85rem" }}>出題順序</FormLabel>
                <RadioGroup value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                  <FormControlLabel value="id" control={<Radio size="small" />} label="ID順" />
                  <FormControlLabel value="random" control={<Radio size="small" />} label="ランダム" />
                </RadioGroup>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* --- 全単語ランダム --- */}
        <Button
          variant="contained"
          color="success"
          fullWidth
          sx={{ py: 1.5, fontSize: "1rem", borderRadius: 3, fontWeight: "bold" }}
          onClick={() => fetchQuiz(null, true)}
        >
          すべての単語からランダム10問
        </Button>

        {/* --- Part選択 --- */}
        {sequenceStarts.length > 0 && (
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                パートを選択 (各10問)
              </Typography>
              <Stack spacing={1}>
                {sequenceStarts.map((id, index) => {
                  const score = scores[id]?.[modeKey] || 0;
                  const isPerfect = score === 10;
                  const hasScore = score > 0;
                  return (
                    <Button
                      key={id}
                      variant={isPerfect ? "contained" : "outlined"}
                      color={isPerfect ? "success" : hasScore ? "primary" : "inherit"}
                      fullWidth
                      sx={{
                        textTransform: "none",
                        py: 1,
                        borderRadius: 2,
                        justifyContent: "space-between",
                        px: 2,
                      }}
                      onClick={() => fetchQuiz(id)}
                    >
                      <span>Part {index + 1}</span>
                      <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                        {score}/10 {isPerfect ? "✅" : hasScore ? "..." : ""}
                      </span>
                    </Button>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
