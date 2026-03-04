// frontend/src/components/UserSetting.jsx

// ReactとMaterial UIのコンポーネントをインポート
import React from "react";
import { Box, Card, CardContent, Stack, TextField, Button, Typography } from "@mui/material";

// UserSettingsコンポーネント定義
export default function UserSettings({
  newUsername,       // 新しいユーザー名の状態
  setNewUsername,    // 新しいユーザー名を更新する関数
  oldPassword,       // 現在のパスワードの状態
  setOldPassword,    // 現在のパスワードを更新する関数
  newPassword,       // 新しいパスワードの状態
  setNewPassword,    // 新しいパスワードを更新する関数
  message,           // メッセージ表示用（エラーや成功通知）
  changeUsername,    // ユーザー名変更処理
  changePassword,    // パスワード変更処理
  onBack,             // 戻る処理
  deleteAccount,
  handleLogout,
}) {
  return (
    // ページ全体コンテナ
    <Box sx={{ minHeight: "100vh", p: 2, bgcolor: "#f5f5f5" }}>
      <Stack spacing={3} maxWidth={400} mx="auto">

        {/* タイトル */}
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h5">ユーザー情報変更</Typography>
          </CardContent>
        </Card>

        {/* ユーザー名変更 */}
        <Card elevation={0}>
          <CardContent>
            <Stack spacing={2}>
              {/* 新しいユーザー名入力欄 */}
              <TextField
                label="新しいユーザー名"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                fullWidth
              />
              {/* ユーザー名変更ボタン */}
              <Button variant="contained" color="primary" onClick={changeUsername} fullWidth>
                ユーザー名を変更
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* パスワード変更 */}
        <Card elevation={0}>
          <CardContent>
            <Stack spacing={2}>
              {/* 現在のパスワード入力欄 */}
              <TextField
                label="現在のパスワード"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                fullWidth
              />
              {/* 新しいパスワード入力欄 */}
              <TextField
                label="新しいパスワード"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                error={
                  newPassword.length > 0 &&
                  (!/^[a-zA-Z0-9]+$/.test(newPassword) || newPassword.length < 8)
                } // 半角英数字8文字未満はエラー表示
                helperText={
                  newPassword.length > 0 &&
                  (!/^[a-zA-Z0-9]+$/.test(newPassword) || newPassword.length < 8)
                    ? "パスワードは半角英数字で8文字以上入力してください"
                    : ""
                }
              />
              {/* パスワード変更ボタン */}
              <Button variant="contained" color="secondary" onClick={changePassword} fullWidth>
                パスワードを変更
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* メッセージ表示（エラーや成功通知） */}
        {message && (
          <Card elevation={0}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography color="error">{message}</Typography>
            </CardContent>
          </Card>
        )}

        {/* アカウント削除ボタン */}
        <Card elevation={0}>
          <CardContent>
            <Stack spacing={2}>
              <Typography color="error" textAlign="center">
                アカウントを削除すると復元できません
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  if (window.confirm("本当にアカウントを削除しますか？")) {
                    deleteAccount();  // propsで渡した削除処理を呼ぶ
                  }
                }}
                fullWidth
              >
                アカウントを削除
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* ログアウト追加 */}
        <Button
          fullWidth
          color="secondary"
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={handleLogout}
        >
          ログアウト
        </Button>

        {/* 戻るボタン */}
        <Button
          variant="outlined"
          color="primary"
          onClick={() => (onBack())}
          fullWidth
        >
          ホームに戻る
        </Button>
      </Stack>
    </Box>
  );
}
