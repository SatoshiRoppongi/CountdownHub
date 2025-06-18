# CountdownHub - デバッグログ

## 重要なデバッグ記録

### システム構築時のデバッグ情報
**日付**: 2024年初期セットアップ  
**問題**: 初期環境構築  
**解決策**: Docker環境とワークスペース設定完了  
**学習事項**: Claude Code知見管理システムの効果的な活用方法

---

## 一般的なトラブルシューティング

### データベース接続問題
**症状**: Prismaクライアントがデータベースに接続できない  
**原因**: DATABASE_URL環境変数の設定不備、またはPostgreSQLサービス未起動  
**解決手順**:
1. `docker-compose ps` でPostgreSQLコンテナ起動確認
2. `.env`ファイルのDATABASE_URL確認
3. `npm run docker:up` でDockerサービス再起動
4. `npm run db:generate` でPrismaクライアント再生成

### フロントエンド・バックエンド通信エラー
**症状**: API呼び出しでCORSエラーまたは接続エラー  
**原因**: バックエンドサーバー未起動、またはURL設定不備  
**解決手順**:
1. `lsof -i :3001` でバックエンドサーバー起動確認
2. `REACT_APP_API_URL`環境変数確認
3. ブラウザ開発者ツールでNetwork タブ確認
4. 必要に応じてサーバー再起動

### ポート衝突問題
**症状**: 開発サーバー起動時の"Port already in use" エラー  
**原因**: 既存プロセスがポートを使用中  
**解決手順**:
1. `lsof -ti:3000 | xargs kill -9` (フロントエンド)
2. `lsof -ti:3001 | xargs kill -9` (バックエンド)
3. `lsof -ti:5432 | xargs kill -9` (PostgreSQL、必要時のみ)

### Docker関連問題
**症状**: Docker コンテナ起動失敗  
**原因**: コンテナ設定不備、リソース不足、ボリューム問題  
**解決手順**:
1. `docker-compose down -v` でボリューム削除
2. `docker system prune` で不要なリソース削除
3. `docker-compose up -d --build` で再ビルド起動

---

## パフォーマンス関連のデバッグ

### フロントエンド パフォーマンス
**問題調査方法**:
1. ブラウザ開発者ツール > Performance タブ
2. React Developer Tools > Profiler
3. `npm run analyze` でバンドルサイズ分析

**よくある問題**:
- 不要な再レンダリング → React.memo, useMemo使用
- 大きなバンドルサイズ → Code splitting, Dynamic import
- メモリリーク → useEffect cleanup function

### バックエンド パフォーマンス  
**問題調査方法**:
1. `console.time()` / `console.timeEnd()` でAPI応答時間測定
2. Prisma Query分析
3. PostgreSQL スロークエリログ確認

**よくある問題**:
- N+1クエリ → include/select使用
- インデックス不足 → EXPLAIN ANALYZE実行
- メモリ使用量過多 → Node.js heapdump分析

---

## セキュリティ関連のデバッグ

### 入力値検証エラー
**症状**: API リクエストで400 Bad Request  
**調査方法**:
1. リクエストボディの内容確認
2. Zodバリデーションエラーメッセージ確認  
3. フロントエンドフォームバリデーション確認

### CORS エラー
**症状**: ブラウザコンソールでCORSエラー  
**解決方法**:
1. バックエンドのCORS設定確認
2. Origin URLが正しく設定されているか確認
3. プリフライトリクエストの対応確認

---

## ビルド・デプロイ関連のデバッグ

### TypeScript コンパイルエラー
**調査手順**:
1. `npm run type-check` で型エラー詳細確認
2. `tsconfig.json` 設定確認
3. 型定義ファイル(.d.ts)の存在確認

### ESLint エラー
**調査手順**:
1. `npm run lint` でエラー詳細確認
2. `.eslintrc.js` 設定確認
3. `npm run lint:fix` で自動修正可能か確認

### ビルドサイズ問題
**調査手順**:
1. `npm run build` でビルドサイズ確認
2. Bundle analyzer使用で大きなモジュール特定
3. 不要なimportの削除

---

## テスト関連のデバッグ

### ユニットテスト失敗
**調査手順**:
1. テストランナーの詳細出力確認
2. モックの設定確認
3. 非同期処理のテスト方法確認

### 統合テスト失敗
**調査手順**:
1. テストデータベースの状態確認
2. API エンドポイントの正常性確認
3. テスト実行順序の依存性確認

---

## デバッグ用ユーティリティ

### ログ出力設定
```javascript
// 開発環境でのデバッグログ
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}

// 構造化ログ出力
logger.info('Event created', { eventId, userId, timestamp });
```

### React デバッグ
```javascript
// コンポーネント再レンダリング調査
useEffect(() => {
  console.log('Component rendered:', { props, state });
});

// useState値の変更追跡
useEffect(() => {
  console.log('State changed:', value);
}, [value]);
```

### API デバッグ
```javascript
// リクエスト/レスポンス ログ
axios.interceptors.request.use(request => {
  console.log('Starting Request', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

---

## 緊急対応手順

### サービス停止時の対応
1. **症状確認**: ログファイル、エラーメッセージ確認
2. **影響範囲特定**: フロントエンド/バックエンド/データベースの特定
3. **緊急対応**: サービス再起動、ロールバック検討
4. **根本原因調査**: ログ分析、コード調査
5. **再発防止策**: 監視強化、テスト追加

### データ整合性問題
1. **現状把握**: データベース状態確認
2. **バックアップ確認**: 最新バックアップの確認
3. **影響評価**: 影響するユーザー・データの特定
4. **修正スクリプト**: データ修正クエリの作成・テスト
5. **実行・確認**: 本番での修正実行と結果確認

---

このデバッグログは、問題発生時の迅速な解決と、類似問題の再発防止のために継続的に更新してください。新しい問題とその解決策を発見した場合は、速やかにここに記録することで、チーム全体の開発効率向上に貢献します。