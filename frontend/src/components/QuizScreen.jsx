// frontend/src/components/QuizScreen.jsx

import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";

export default function QuizScreen({
  quiz,
  quizType,
  mode,
  choices,
  inputAnswer,
  setInputAnswer,
  selected,
  handleAnswer,
  handleDontKnow,
  currentScore,
  setStarted,
  resultMessage,
  currentIndex,
  totalQuestions,
}) {
  const questionText =
    mode.question === "chinese"
      ? quiz.chinese
      : mode.question === "pinyin"
      ? quiz.pinyin
      : quiz.answer;

  const toneMap = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
  };

  function convertPinyinWithNumber(input) {
    return input
      .replace(/([aeiouü])([1-4])/g, (_, vowel, tone) => {
        const t = parseInt(tone, 10) - 1;
        return toneMap[vowel][t] || vowel;
      })
      .replace(/([aeiouü])5/g, "$1");
  }

  const progress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;
  const isCorrectMessage = resultMessage.startsWith("✅");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 2,
        bgcolor: "#f0f4f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Stack spacing={2} maxWidth={400} width="100%">

        {/* --- 進捗バー --- */}
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ pb: "12px !important" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                問題 {currentIndex + 1} / {totalQuestions}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                スコア: {currentScore}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 7, borderRadius: 4 }}
            />
          </CardContent>
        </Card>

        {/* --- 問題カード --- */}
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", p: 3 }}>

            {/* 問題文 */}
            <Typography
              variant={mode.question === "chinese" ? "h3" : "h5"}
              gutterBottom
              sx={{
                fontWeight: "bold",
                lineHeight: 1.3,
                mb: 2,
              }}
            >
              {questionText}
            </Typography>

            {/* 選択肢 or 入力 */}
            {quizType === "choice" ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {choices.map((c, i) => {
                  let btnColor = "inherit";
                  let btnVariant = "outlined";
                  if (selected) {
                    const correctAnswer =
                      mode.answer === "chinese"
                        ? quiz.chinese
                        : mode.answer === "pinyin"
                        ? quiz.pinyin
                        : quiz.answer;
                    if (c === correctAnswer) {
                      btnColor = "success";
                      btnVariant = "contained";
                    } else if (c === selected) {
                      btnColor = "error";
                      btnVariant = "contained";
                    }
                  }
                  return (
                    <Button
                      key={i}
                      variant={btnVariant}
                      color={btnColor}
                      fullWidth
                      sx={{ textTransform: "none", py: 1.25, fontSize: "1rem", borderRadius: 2 }}
                      onClick={() => handleAnswer(c)}
                      disabled={!!selected}
                    >
                      {c}
                    </Button>
                  );
                })}

                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  sx={{ textTransform: "none", py: 1.25, fontSize: "1rem", borderRadius: 2 }}
                  onClick={handleDontKnow}
                  disabled={!!selected}
                >
                  わからない
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  value={inputAnswer}
                  onChange={(e) =>
                    mode.answer === "pinyin"
                      ? setInputAnswer(convertPinyinWithNumber(e.target.value))
                      : setInputAnswer(e.target.value)
                  }
                  placeholder={
                    mode.answer === "pinyin"
                      ? "答えを入力 (例: ma3 → mǎ)"
                      : "答えを入力"
                  }
                  disabled={!!selected}
                  size="small"
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ borderRadius: 2 }}
                    onClick={() => handleAnswer()}
                    disabled={!inputAnswer || !!selected}
                  >
                    回答
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    sx={{ borderRadius: 2 }}
                    onClick={handleDontKnow}
                    disabled={!!selected}
                  >
                    わからない
                  </Button>
                </Stack>
              </Stack>
            )}

            {/* 正解/不正解メッセージ */}
            <Box sx={{ minHeight: "2.5rem", mt: 2 }}>
              {resultMessage && (
                <Typography
                  sx={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: isCorrectMessage ? "success.main" : "error.main",
                  }}
                >
                  {resultMessage}
                </Typography>
              )}
            </Box>

            {/* 戻るボタン */}
            <Button
              variant="text"
              color="error"
              sx={{ mt: 1, fontSize: "0.85rem" }}
              onClick={() => setStarted(false)}
              fullWidth
            >
              戻る（スコア破棄）
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
