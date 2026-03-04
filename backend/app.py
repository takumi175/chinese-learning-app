# ================================
# backend/app.py
# 中国語単語クイズアプリのバックエンドAPI
# Flask をベースに、ユーザー認証・クイズ・スコア管理などを提供
# ================================

# ----------- 必要なライブラリのインポート -----------
from flask import Flask, request, jsonify       # Flask本体、リクエスト・レスポンス処理
from flask_bcrypt import Bcrypt                 # パスワードのハッシュ化・検証
from sqlalchemy import create_engine, text      # データベース接続とSQL実行
import random, jwt, datetime, os                # 標準ライブラリ: ランダム・JWT認証・日時・環境変数
from flask_cors import CORS                     # フロントとバックエンドをつなぐCORS対応
from functools import wraps                     # デコレーター作成用
from dotenv import load_dotenv                  # .envファイルから環境変数を読み込む

# ----------- 環境変数の読み込み -----------
load_dotenv(override=True)  # ローカル開発環境用に .env を読み込む（本番はサーバー側で設定）

# データベース接続URL（PostgreSQLなど）
DATABASE_URL = os.environ["DATABASE_URL"]
# Flaskアプリ用の秘密鍵（JWTトークン生成や検証に使用）
SECRET_KEY = os.environ["SECRET_KEY"]
# フロントエンドのURL（CORSでアクセス許可するため必須）
FRONTEND_URL = os.environ.get("FRONTEND_URL")
if not FRONTEND_URL:
    raise RuntimeError("FRONTEND_URL が設定されていません")  # 環境変数未設定なら強制終了

# ----------- Flaskアプリの初期化 -----------
app = Flask(__name__)                    # Flaskアプリ作成
app.config["SECRET_KEY"] = SECRET_KEY    # Flaskアプリの設定に秘密鍵を登録

# CORS設定：フロントエンドURLのみ許可し、Cookieや認証情報を扱えるようにする
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])

# BcryptをFlaskアプリに紐づけ（パスワードハッシュ化に使用）
bcrypt = Bcrypt(app)

# データベース接続エンジン作成（SQLAlchemy）
engine = create_engine(DATABASE_URL, future=True)

# ----------- JWT関連の関数 -----------
def create_token(user_id, days_valid=1):
    """
    JWTトークンを生成する関数
    - user_id を埋め込み
    - 有効期限はデフォルト1日
    """
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=days_valid)  # 有効期限
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")  # トークン生成

def verify_token(token):
    """
    トークンを検証して user_id を返す関数
    - 正常なら user_id を返す
    - 無効・期限切れなら None を返す
    """
    try:
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        return payload["user_id"]  # トークン内の user_id を返す
    except jwt.ExpiredSignatureError:  # 期限切れ
        return None
    except jwt.InvalidTokenError:      # 不正トークン
        return None

def jwt_required(f):
    """
    JWT必須のデコレーター
    APIの処理の前にトークンを確認し、正しければ request.user_id にセット
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        # リクエストヘッダーから Authorization を取得
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"status":"error","message":"Unauthorized"}), 401

        # "Bearer <token>" の形式からトークンを取り出す
        token = auth_header.split(" ")[1]

        # トークン検証
        user_id = verify_token(token)
        if not user_id:
            return jsonify({"status":"error","message":"Unauthorized"}), 401

        # リクエストに user_id を持たせて次の処理へ
        request.user_id = user_id
        return f(*args, **kwargs)
    return wrapper

# ----------- 認証API -----------
@app.route("/api/register", methods=["POST"])
def register():
    """
    ユーザー登録API
    - username と password を受け取り
    - パスワードをハッシュ化してDBに保存
    """
    data = request.json
    username = data.get("username", "").strip()   # ユーザー名
    password = data.get("password", "")           # パスワード

    # 入力チェック（必須 + パスワード最低8文字）
    if not username or not password or len(password) < 8:
        return jsonify({"status":"error","message":"ユーザー名またはパスワードが無効"}), 400

    # パスワードをハッシュ化
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    # DBに新しいユーザーを登録
    try:
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO users (username,password_hash) VALUES (:u,:p)"),
                {"u":username,"p":pw_hash}
            )
    except:  # 既に同じユーザー名が存在する場合など
        return jsonify({"status":"error","message":"ユーザー名が既に存在"}), 400

    return jsonify({"status":"ok"})

@app.route("/api/login", methods=["POST"])
def login():
    """
    ログインAPI
    - username と password を受け取り
    - 一致すればJWTトークンを返す
    """
    data = request.json
    username = data.get("username", "")
    password = data.get("password", "")

    # DBからユーザーを探す
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id,password_hash FROM users WHERE username=:u"),
            {"u":username}
        ).fetchone()

    # ユーザーが存在 & パスワード一致ならトークンを返す
    if row and bcrypt.check_password_hash(row.password_hash, password):
        token = create_token(row.id)
        return jsonify({"status":"ok","token":token,"username":username})

    return jsonify({"status":"error","message":"ユーザー名かパスワードが違います"}), 401

@app.route("/api/me", methods=["GET"])
@jwt_required
def me():
    """
    ログイン中のユーザー情報を返すAPI
    """
    user_id = request.user_id
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT username FROM users WHERE id=:id"),
            {"id":user_id}
        ).fetchone()
    if row:
        return jsonify({"logged_in":True,"username":row.username})
    return jsonify({"logged_in":False})

# ----------- クイズ機能 -----------
def make_choices(all_words, word):
    """
    クイズ用の選択肢を作成する関数
    - 正解 + 他の単語からランダムに選んだ3つを混ぜる
    """
    others = [w for w in all_words if w.id != word.id]  # 他の単語候補
    distractors = random.sample(others, min(3,len(others)))  # ダミー選択肢

    # 日本語訳 / 中国語 / ピンイン の選択肢を作成
    jp_choices = [word.translation] + [d.translation for d in distractors]
    zh_choices = [word.chinese_simplified] + [d.chinese_simplified for d in distractors]
    py_choices = [word.pinyin] + [d.pinyin for d in distractors]

    # ランダム順に並べ替え
    random.shuffle(jp_choices)
    random.shuffle(zh_choices)
    random.shuffle(py_choices)
    return jp_choices, zh_choices, py_choices

@app.route("/api/quiz/sequence")
def quiz_sequence():
    """
    連続出題モードのクイズ
    - start_id から順に10問
    """
    start_id = int(request.args.get("start_id",1))  # クエリパラメータから開始ID取得
    count = 10
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id,chinese_simplified,pinyin,translation FROM words WHERE id >= :start_id ORDER BY id ASC LIMIT :count"
        ),{"start_id":start_id,"count":count}).fetchall()

    # 出題データを整形
    quiz_data=[]
    for w in rows:
        jp, zh, py = make_choices(rows, w)
        quiz_data.append({
            "id": w.id,
            "chinese": w.chinese_simplified,
            "pinyin": w.pinyin,
            "answer": w.translation,
            "choices": jp,
            "all_chinese": zh,
            "all_pinyin": py
        })
    return jsonify(quiz_data)

@app.route("/api/quiz/all_random")
def all_random_quiz():
    """
    ランダム出題モードのクイズ
    - 全単語からランダムに count 問
    """
    count = int(request.args.get("count",10))
    with engine.connect() as conn:
        all_words = conn.execute(text("SELECT id,chinese_simplified,pinyin,translation FROM words")).fetchall()
    selected = random.sample(all_words,min(count,len(all_words)))

    quiz_data=[]
    for w in selected:
        jp, zh, py = make_choices(all_words, w)
        quiz_data.append({
            "id": w.id,
            "chinese": w.chinese_simplified,
            "pinyin": w.pinyin,
            "answer": w.translation,
            "choices": jp,
            "all_chinese": zh,
            "all_pinyin": py
        })
    return jsonify(quiz_data)

@app.route("/api/quiz/sequence_ids")
def sequence_ids():
    """
    連続モード用の start_id 一覧を返すAPI
    - 10問ごとに区切ったIDを返す
    """
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id FROM words ORDER BY id ASC")).fetchall()
    ids = [r.id for r in rows]
    return jsonify(ids[::10])

# ----------- スコア機能 -----------
@app.route("/api/scores", methods=["GET"])
@jwt_required
def get_scores():
    """
    ログイン中のユーザーのスコア一覧を取得
    """
    user_id = request.user_id
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT start_id,mode,score FROM scores WHERE user_id=:uid"),{"uid":user_id}).fetchall()
    result={}
    for r in rows:
        if r.start_id not in result:
            result[r.start_id]={}
        result[r.start_id][r.mode]=r.score
    return jsonify(result)

@app.route("/api/score/update", methods=["POST"])
@jwt_required
def update_score():
    """
    スコアを更新するAPI
    - 既存スコアより高ければ更新
    """
    user_id = request.user_id
    data = request.json
    start_id = data["start_id"]
    mode = data["mode"]
    new_score = data["score"]

    with engine.connect() as conn:
        existing = conn.execute(text(
            "SELECT score FROM scores WHERE user_id=:uid AND start_id=:sid AND mode=:mode"
        ),{"uid":user_id,"sid":start_id,"mode":mode}).fetchone()

        if not existing:  # スコア未登録なら新規追加
            conn.execute(text(
                "INSERT INTO scores (user_id,start_id,mode,score) VALUES (:uid,:sid,:mode,:score)"
            ),{"uid":user_id,"sid":start_id,"mode":mode,"score":new_score})
        elif new_score>existing.score:  # 新しいスコアが高ければ更新
            conn.execute(text(
                "UPDATE scores SET score=:score WHERE user_id=:uid AND start_id=:sid AND mode=:mode"
            ),{"score":new_score,"uid":user_id,"sid":start_id,"mode":mode})
        conn.commit()
    return jsonify({"status":"ok"})

@app.route("/api/ranking", methods=["GET"])
@jwt_required
def ranking():
    """
    ランキングAPI
    - 各ユーザーの総合スコアを計算して順位付け
    """
    with engine.connect() as conn:
        users = conn.execute(text("SELECT id, username FROM users")).fetchall()
        scores = conn.execute(text("SELECT user_id, start_id, mode, score FROM scores")).fetchall()

    result = []
    for u in users:
        user_scores = {}
        for s in scores:
            if s.user_id == u.id:
                if s.start_id not in user_scores:
                    user_scores[s.start_id] = {}
                user_scores[s.start_id][s.mode] = s.score

        # ユーザーごとの合計スコア
        total_score = sum(sum(mode_scores.values()) for mode_scores in user_scores.values())
        result.append({
            "username": u.username,
            "totalScore": total_score,
            "scores": user_scores
        })

    # 合計スコア順に並べ替え
    result.sort(key=lambda x: x["totalScore"], reverse=True)
    return jsonify(result)

# ----------- 単語一覧取得 -----------
@app.route("/api/words", methods=["GET"])
@jwt_required
def get_words():
    """
    単語リストをすべて取得するAPI
    """
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id,chinese_simplified,pinyin,translation FROM words ORDER BY id ASC")).fetchall()
    result = [{"id": r.id, "chinese": r.chinese_simplified, "pinyin": r.pinyin, "translation": r.translation} for r in rows]
    return jsonify(result)

# ----------- ユーザー名変更 -----------
@app.route("/api/me/username", methods=["PUT"])
@jwt_required
def change_username():
    """
    ユーザー名を変更するAPI
    """
    user_id = request.user_id
    data = request.json
    new_username = data.get("username")

    if not new_username:
        return jsonify({"status":"error","message":"新しいユーザー名を指定してください"}),400

    with engine.connect() as conn:
        # 同じユーザー名が既に存在するかチェック
        exists = conn.execute(text("SELECT id FROM users WHERE username=:u"), {"u": new_username}).fetchone()
        if exists:
            return jsonify({"status":"error","message":"そのユーザー名は既に存在します"}),400
        
        # ユーザー名を更新
        conn.execute(text("UPDATE users SET username=:u WHERE id=:id"), {"u": new_username, "id": user_id})
        conn.commit()

    return jsonify({"status":"ok","username":new_username})

# ----------- パスワード変更 -----------
@app.route("/api/me/password", methods=["PUT"])
@jwt_required
def change_password():
    """
    パスワードを変更するAPI
    """
    user_id = request.user_id
    data = request.json
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"status":"error","message":"古いパスワードと新しいパスワードを両方指定してください"}),400
    if not new_password or len(new_password) < 8:
        return jsonify({"status":"error","message":"新しいパスワードが無効"}), 400

    with engine.connect() as conn:
        # 古いパスワードの確認
        row = conn.execute(text("SELECT password_hash FROM users WHERE id=:id"), {"id": user_id}).fetchone()
        if not row or not bcrypt.check_password_hash(row.password_hash, old_password):
            return jsonify({"status":"error","message":"古いパスワードが間違っています"}),400
        
        # 新しいパスワードをハッシュ化して保存
        new_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
        conn.execute(text("UPDATE users SET password_hash=:p WHERE id=:id"), {"p": new_hash, "id": user_id})
        conn.commit()

    return jsonify({"status":"ok"})

@app.route("/api/me/delete", methods=["DELETE"])
@jwt_required
def delete_account():
    user_id = request.user_id
    with engine.begin() as conn:
        # ユーザーのスコアを削除
        conn.execute(text("DELETE FROM scores WHERE user_id=:uid"), {"uid": user_id})
        # ユーザー自体を削除
        conn.execute(text("DELETE FROM users WHERE id=:uid"), {"uid": user_id})
    return jsonify({"status":"ok"})

# ----------- エラー処理 -----------
@app.errorhandler(500)
def internal_error(e):
    """
    サーバー内部エラー（500）のハンドリング
    - 何らかの例外が発生した場合にJSONで返す
    """
    return jsonify({"status":"error","message":"サーバーエラー"}), 500

@app.errorhandler(404)
def not_found(e):
    """
    Not Found（404）のハンドリング
    - 存在しないAPIエンドポイントにアクセスした場合にJSONで返す
    """
    return jsonify({"status":"error","message":"Not Found"}), 404

# ----------- 開発用エントリポイント（本番では不要） -----------
if __name__=="__main__":
    app.run(debug=True)  # 開発時はデバッグモードで起動
