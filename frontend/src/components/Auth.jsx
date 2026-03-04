// frontend/src/components/Auth.jsx

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert
} from "@mui/material";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = () => {
    const url = mode === "login"
      ? `${API_URL}/api/login`
      : `${API_URL}/api/register`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") {
          if (mode === "login") {
            localStorage.setItem("token", data.token);
            onLogin(data.username);
          } else {
            setMode("login");
          }
        } else {
          setError(data.message || "エラー");
        }
      })
      .catch(() => setError("接続できません"));
  };

  const passwordError =
    password.length > 0 &&
    (!/^[a-zA-Z0-9]+$/.test(password) || password.length < 8);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f0f4f8",
        p: 2,
      }}
    >
      {/* アプリタイトル */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "#d32f2f", letterSpacing: 2 }}
        >
          中国語単語学習
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          ピンイン・漢字・日本語をマスターしよう
        </Typography>
      </Box>

      {/* フォームカード */}
      <Stack
        spacing={2}
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "#fff",
          p: 4,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="h5" align="center" sx={{ fontWeight: "bold" }}>
          {mode === "login" ? "ログイン" : "新規登録"}
        </Typography>

        <TextField
          label="ユーザー名"
          value={username}
          onChange={e => setUsername(e.target.value)}
          fullWidth
          size="small"
        />

        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          size="small"
          error={passwordError}
          helperText={passwordError ? "パスワードは半角英数字で8文字以上入力してください" : ""}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          fullWidth
          sx={{ py: 1.2, fontWeight: "bold" }}
        >
          {mode === "login" ? "ログイン" : "登録"}
        </Button>

        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

        <Typography align="center" variant="body2" color="text.secondary">
          {mode === "login" ? (
            <>アカウントがない場合{" "}
              <Button variant="text" size="small" onClick={() => { setMode("register"); setError(""); }}>
                新規登録
              </Button>
            </>
          ) : (
            <>既にアカウントある場合{" "}
              <Button variant="text" size="small" onClick={() => { setMode("login"); setError(""); }}>
                ログイン
              </Button>
            </>
          )}
        </Typography>
      </Stack>
    </Box>
  );
}
