# CountdownHub - Claude Code Knowledge Management

## プロジェクト概要
CountdownHub は、イベントのカウントダウンタイマーを管理するウェブアプリケーションです。

## 技術スタック
- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Container**: Docker + Docker Compose
- **Styling**: Tailwind CSS

## プロジェクト構成
```
CountdownHub/
├── CLAUDE.md                    # このファイル - プロジェクト知見管理
├── .claude/                     # Claude Code知見管理システム
│   ├── context.md              # プロジェクト背景・制約
│   ├── project-knowledge.md    # 技術的知見・パターン
│   ├── project-improvements.md # 改善履歴・教訓
│   ├── common-patterns.md      # 頻用コマンドパターン
│   ├── debug-log.md            # 重要なデバッグ記録
│   └── debug/                  # デバッグファイル管理
├── frontend/                   # React フロントエンド
├── backend/                    # Node.js バックエンド
└── docs/                       # プロジェクトドキュメント
```

## 開発環境セットアップ
```bash
# 初期セットアップ
./scripts/setup.sh

# 開発サーバー起動
docker-compose up -d
```

## Claude Code 使用時の注意点
- 新機能実装前に `.claude/context.md` を確認
- 技術的決定は `.claude/project-knowledge.md` に記録
- 重要なデバッグ情報は `.claude/debug-log.md` に保存
- 改善履歴は `.claude/project-improvements.md` に追記

## 知見管理システム
このプロジェクトでは、Claude Codeとの効率的なコミュニケーションのため、`.claude/` ディレクトリ配下に体系的な知見管理システムを構築しています。各ファイルの詳細は該当ファイルを参照してください。