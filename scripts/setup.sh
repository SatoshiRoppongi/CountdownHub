#!/bin/bash

echo "🚀 CountdownHub セットアップスクリプト"
echo "======================================"

# 環境変数ファイルのコピー
if [ ! -f .env ]; then
    echo "📋 環境変数ファイルをコピー中..."
    cp .env.example .env
    echo "✅ .env ファイルが作成されました"
else
    echo "ℹ️  .env ファイルは既に存在します"
fi

# ルートディレクトリの依存関係インストール
echo "📦 ルートディレクトリの依存関係をインストール中..."
npm install

# バックエンドの依存関係インストール
echo "📦 バックエンドの依存関係をインストール中..."
cd backend && npm install && cd ..

# フロントエンドの依存関係インストール
echo "📦 フロントエンドの依存関係をインストール中..."
cd frontend && npm install && cd ..

# Docker環境の起動
echo "🐳 Docker環境を起動中..."
docker-compose up -d db

# データベースの起動を待機
echo "⏳ データベースの起動を待機中..."
sleep 10

# Prismaクライアント生成
echo "🔧 Prismaクライアントを生成中..."
cd backend && npx prisma generate && cd ..

# データベースマイグレーション
echo "🗃️  データベースマイグレーションを実行中..."
cd backend && npx prisma migrate dev --name init && cd ..

# サンプルデータの投入
echo "📊 サンプルデータを投入中..."
cd backend && npx prisma db seed && cd ..

echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "🎯 次のステップ:"
echo "1. 開発サーバーを起動: npm run dev"
echo "2. ブラウザで http://localhost:3000 にアクセス"
echo "3. API: http://localhost:3001"
echo "4. Prisma Studio: npm run db:studio"
echo ""
echo "🐳 Docker コマンド:"
echo "- 停止: docker-compose down"
echo "- 再起動: docker-compose restart"
echo "- ログ確認: docker-compose logs"