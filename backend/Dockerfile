# =============================================================================
# CountdownHub バックエンド Dockerfile (開発環境)
#
# Express + TypeScript の開発サーバーを nodemon でホットリロード起動する。
# ベースイメージに Node.js 20 Bullseye (Debian) を使用。
#
# Alpine ではなく Bullseye を採用する理由:
#   Prisma ORM が内部で使用するクエリエンジンのバイナリが
#   OpenSSL 1.1 に依存しており、Alpine の musl libc と互換性の問題がある。
#   Bullseye には libssl1.1 を apt-get で追加インストールすることで対応。
#
# ビルドキャッシュの最適化:
#   1. package*.json と prisma/ を先にコピー
#   2. npm install 時に postinstall スクリプトで prisma generate が自動実行
#   3. ソースコード変更時の再ビルドを最小化
#
# 公開ポート: 3001 (Express API サーバー)
# =============================================================================

FROM node:20-bullseye

# Prisma クエリエンジンが必要とする OpenSSL 1.1 をインストール
RUN apt-get update && apt-get install -y libssl1.1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存関係のインストール準備 (キャッシュ効率のため先にコピー)
COPY package*.json ./

# Prisma スキーマを先にコピー (npm install の postinstall で prisma generate が実行されるため)
COPY prisma ./prisma/

# 依存関係のインストール + Prisma クライアント生成 (postinstall)
RUN npm install

# 残りのソースコードをコピー (開発時はバインドマウントで上書きされる)
COPY . .

# Express API サーバーのポート
EXPOSE 3001

# 開発サーバー起動 (nodemon による TypeScript ホットリロード)
CMD ["npm", "run", "dev"]
