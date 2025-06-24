# CountdownHub - デバッグログ

## 重要なデバッグ記録

### システム構築時のデバッグ情報
**日付**: 2024年初期セットアップ  
**問題**: 初期環境構築  
**解決策**: Docker環境とワークスペース設定完了  
**学習事項**: Claude Code知見管理システムの効果的な活用方法

---

### 本番環境CORS設定問題 (2025-06-23)
**日付**: 2025-06-23 19:42  
**問題**: 本番環境でお問い合わせフォーム送信時にCORSエラー発生
```
Access to XMLHttpRequest at 'https://api.countdownhub.jp/api/contact' 
from origin 'https://www.countdownhub.jp' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**原因分析**:
1. フロントエンド(`www.countdownhub.jp`)とAPI(`api.countdownhub.jp`)が異なるドメイン
2. プリフライトリクエスト(OPTIONS)に対する適切なレスポンス不足
3. 本番環境の環境変数設定不備

**解決策**:
1. **バックエンドCORS設定強化** (`backend/src/index.ts`):
   - プリフライトリクエストの明示的処理追加
   - 許可ヘッダー拡張: `X-Requested-With`, `Accept`, `Origin`
   - `optionsSuccessStatus: 200`設定
   - 詳細デバッグログ追加

2. **フロントエンドAPI URL設定改善** (`frontend/src/services/api.ts`):
   - 動的ドメイン検出による正確なAPI URLマッピング
   - `www.countdownhub.jp` → `https://api.countdownhub.jp`の自動変換

3. **環境変数ファイル整理**:
   - `.env.development`: 開発環境用設定
   - `.env.production`: 本番環境用設定

**検証方法**:
```bash
# 本番環境でのプリフライトリクエスト確認
curl -X OPTIONS https://api.countdownhub.jp/api/contact \
  -H "Origin: https://www.countdownhub.jp" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**コミット**: `ea86764 - fix: 本番環境でのCORS設定問題を修正`

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

**具体的なデバッグ記録 (2024-06-22)**:
- **問題**: CI環境でReact Hook useEffect dependency警告がerror扱いされてビルド失敗
- **エラー**: `React Hook useEffect has missing dependencies: 'timeLeft.isExpired' and 'wasRunning'`
- **根本原因**: `useEffect`の依存配列から状態変数を削除したことで無限ループを防いだが、ESLintルールに違反
- **解決策**: `setTimeLeft`を関数型更新(`prev => { ... }`)に変更し、必要な依存関係のみ追加
- **教訓**: CI/CDでtreat-warnings-as-errorsが有効な場合、ESLint警告も修正必須

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

**重大事例 (2025-06-23): 本番環境データ消失インシデント**
- **発生**: お知らせシステム実装後、既存イベントが表示されなくなった
- **原因**: 危険な外部キー制約（`onDelete: Cascade`）による参照整合性エラー
- **初期対応ミス**: 開発環境で`--force-reset`を実行（本番では絶対禁止）
- **正しい対応**: 
  - まずバックアップ確認
  - 段階的マイグレーション（`prisma migrate deploy`）
  - 外部キー制約を安全な設定（`onDelete: SetNull`）に変更
- **予防策**: 
  - 本番デプロイ前にステージング環境で必ずテスト
  - 外部キー制約は`SetNull`または`Restrict`を優先
  - データベース変更前は必ずバックアップ取得

**重大事例 (2025-06-24): カウントダウンタイマーのSTART!アニメーション不具合 [究極解決版]**
- **発生**: 開催中・終了済みイベントでもSTART!アニメーションが表示される問題 + 0秒時のアニメーションが動作しない問題
- **根本原因**: 致命的な論理欠陥を発見
  1. `diff = 500ms`時点で`currentTotalSeconds = 0`になるが、実際はまだ0.5秒残っている
  2. `prevTotalSecondsRef.current = 0`に更新されてしまう
  3. `diff = -500ms`時点で`wasCountingDown = false`（前回が0だから）になる
  4. よって`justReachedZero = false`でアニメーションが絶対に発生しない
- **副次的問題**: "Maximum update depth exceeded" エラーが大量発生
  - 原因: `onFinish`コールバック関数が`useEffect`の依存配列に含まれ、無限ループを発生
- **究極解決策**: **開始時刻通過の瞬間検出**
  1. **概念の転換**: 秒数ではなく開始時刻を過ぎたかどうか（`hasStarted = diff <= 0`）を記録
  2. **確実な遷移検出**: `prevHasStarted === false && hasStarted === true`で確実に遷移を検出
  3. **論理的に正しい**: `diff <= 0`になった瞬間（開始時刻を過ぎた瞬間）を正確に検出
  4. **シンプルかつ確実**: 複雑な条件分岐なし、明確で理解しやすいロジック
- **修正ファイル**: 
  - `frontend/src/hooks/useCountdown.ts:104,109,123-242` - 根本的なアプローチ変更
  - `frontend/src/components/CountdownTimer.tsx:23,37-46` - アニメーション制御の簡素化
- **効果**: 
  - ✅ リアルタイムでカウントダウンが0になった時のみSTART!アニメーション表示
  - ✅ 何度でも0秒アニメーションが発生（テストしやすい）  
  - ✅ 初期状態で既に開始済み/終了済みのイベントではアニメーション表示されない
  - ✅ "Maximum update depth exceeded" エラー解消
  - ✅ 論理的に正しく理解しやすいコード
- **デバッグ機能**: 
  - 開始時刻前後10秒でデバッグログ出力（`hasStarted`, `prevHasStarted`, `justStarted`）
  - アニメーション発生時と終了時にコンソールログ出力
- **教訓**: 
  - **論理欠陥の恐ろしさ**: 表面的な修正では根本解決できない
  - **概念の転換の重要性**: 秒数比較→開始時刻通過検出への発想転換が決定的
  - **シンプルイズベスト**: 複雑なロジックは必ず破綻する
  - **デバッグファースト**: 動作確認できる仕組みを最初から組み込む

---

このデバッグログは、問題発生時の迅速な解決と、類似問題の再発防止のために継続的に更新してください。新しい問題とその解決策を発見した場合は、速やかにここに記録することで、チーム全体の開発効率向上に貢献します。