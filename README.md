# 中国語単語学習アプリ

中国語の単語をクイズ形式で学習できるWebアプリです。

## 機能

- ユーザー登録・ログイン（JWT認証）
- **連続出題モード** — 単語をID順に10問ずつ出題
- **ランダム出題モード** — 全単語からランダムに出題
- スコア記録・ランキング表示
- ユーザー設定（ユーザー名変更・パスワード変更・アカウント削除）

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | React 18 / Vite / MUI / React Router |
| バックエンド | Python / Flask / SQLAlchemy |
| データベース | PostgreSQL |
| 認証 | JWT（PyJWT）/ bcrypt |

## ディレクトリ構成

```
chinese-learning-app/
├── backend/
│   ├── app.py              # Flask APIサーバー
│   ├── requirements.txt    # Pythonパッケージ一覧
│   ├── .env.example        # 環境変数テンプレート
│   └── database/
│       ├── words.sql       # 単語テーブルのスキーマ＆データ
│       ├── users.sql       # ユーザーテーブルのスキーマ
│       └── scores.sql      # スコアテーブルのスキーマ
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── components/
    │       ├── Auth.jsx         # ログイン・登録画面
    │       ├── QuizApp.jsx      # クイズアプリ本体
    │       ├── QuizHome.jsx     # クイズトップ画面
    │       ├── QuizScreen.jsx   # クイズ出題画面
    │       ├── QuizResult.jsx   # クイズ結果画面
    │       ├── Ranking.jsx      # ランキング画面
    │       ├── UserSettings.jsx # ユーザー設定画面
    │       └── WordList.jsx     # 単語一覧画面
    ├── .env.example        # 環境変数テンプレート
    └── package.json
```

## セットアップ

### 前提条件

- Python 3.11+
- Node.js 18+
- PostgreSQL

### 1. データベースの準備

```bash
# PostgreSQLでDBとユーザーを作成
psql -U postgres
CREATE DATABASE cwdb;
CREATE USER cwuser WITH PASSWORD 'cwpass';
GRANT ALL PRIVILEGES ON DATABASE cwdb TO cwuser;
\q

# テーブルを作成（順番通りに実行）
psql -U cwuser -d cwdb -f backend/database/users.sql
psql -U cwuser -d cwdb -f backend/database/words.sql
psql -U cwuser -d cwdb -f backend/database/scores.sql
```

### 2. バックエンドのセットアップ

```bash
cd backend

# 環境変数ファイルを作成
cp .env.example .env
# .env を編集して DATABASE_URL, SECRET_KEY, FRONTEND_URL を設定

# 仮想環境を作成・有効化
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# パッケージをインストール
pip install -r requirements.txt

# 開発サーバー起動
python app.py
```

### 3. フロントエンドのセットアップ

```bash
cd frontend

# 環境変数ファイルを作成
cp .env.example .env
# 必要に応じて VITE_API_URL を編集

# パッケージをインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:5173` を開くと使用できます。

## 環境変数

### backend/.env

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql+psycopg2://user:pass@localhost:5432/dbname` |
| `SECRET_KEY` | JWT署名用の秘密鍵 | ランダムな長い文字列 |
| `FRONTEND_URL` | フロントエンドのURL（CORS許可） | `http://localhost:5173` |

### frontend/.env

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `VITE_API_URL` | バックエンドAPIのURL | `http://127.0.0.1:5000` |
