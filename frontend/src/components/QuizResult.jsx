// frontend/src/components/QuizResult.jsx

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
} from "@mui/material";

export default function QuizResult({ results, currentScore, quizList, onBack }) {
  const total = quizList.length;
  const pct = total > 0 ? Math.round((currentScore / total) * 100) : 0;
  const scoreColor = pct >= 80 ? "success.main" : pct >= 50 ? "warning.main" : "error.main";
  const message = pct >= 80 ? "素晴らしい！" : pct >= 50 ? "もう少し！" : "頑張りましょう！";

  return (
    <Box sx={{ minHeight: "100vh", p: 2, bgcolor: "#f0f4f8", overflowY: "auto" }}>
      <Stack spacing={2} maxWidth={400} mx="auto">

        {/* スコアカード */}
        <Card elevation={1} sx={{ borderRadius: 3, textAlign: "center" }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>結果</Typography>
            <Typography variant="h2" sx={{ color: scoreColor, fontWeight: "bold", lineHeight: 1 }}>
              {currentScore}
              <Typography component="span" variant="h5" color="text.secondary"> / {total}</Typography>
            </Typography>
            <Typography variant="h6" sx={{ color: scoreColor, mt: 0.5 }}>
              {pct}%
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold", color: scoreColor }}>
              {message}
            </Typography>
          </CardContent>
        </Card>

        {/* 問題ごとの結果 */}
        <Stack spacing={1.5}>
          {results.map((res, i) => (
            <Card key={i} elevation={1} sx={{ borderRadius: 3, borderLeft: `4px solid ${res.isCorrect ? "#4caf50" : "#f44336"}` }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  問題 {i + 1}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>
                  {res.question}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: res.isCorrect ? "success.main" : "error.main", fontWeight: "bold" }}
                >
                  {res.isCorrect ? "✅" : "❌"} {res.userAnswer}
                </Typography>
                {!res.isCorrect && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    正解: {res.correctAnswer}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ py: 1.5, borderRadius: 3, fontWeight: "bold" }}
          onClick={onBack}
        >
          ホームに戻る
        </Button>

      </Stack>
    </Box>
  );
}
