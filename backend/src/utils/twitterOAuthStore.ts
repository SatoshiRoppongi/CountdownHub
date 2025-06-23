// Twitter OAuth用トークンストレージ（セッション非依存）

interface TwitterOAuthToken {
  token: string;
  tokenSecret: string;
  userId?: string;
  expiresAt: Date;
}

class TwitterOAuthStore {
  private static instance: TwitterOAuthStore;
  private tokens: Map<string, TwitterOAuthToken> = new Map();

  private constructor() {
    // 定期的にExpiredトークンをクリーンアップ
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 5 * 60 * 1000); // 5分毎
  }

  static getInstance(): TwitterOAuthStore {
    if (!TwitterOAuthStore.instance) {
      TwitterOAuthStore.instance = new TwitterOAuthStore();
    }
    return TwitterOAuthStore.instance;
  }

  // リクエストトークンを保存
  storeRequestToken(token: string, tokenSecret: string): string {
    const key = this.generateKey();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分後に期限切れ

    this.tokens.set(key, {
      token,
      tokenSecret,
      expiresAt
    });

    console.log('🔐 Stored Twitter request token:', { key, token: token.substring(0, 10) + '...', expiresAt });
    return key;
  }

  // リクエストトークンを取得
  getRequestToken(key: string): { token: string; tokenSecret: string } | null {
    const tokenData = this.tokens.get(key);
    
    if (!tokenData) {
      console.log('❌ Twitter request token not found:', key);
      return null;
    }

    if (tokenData.expiresAt < new Date()) {
      console.log('⏰ Twitter request token expired:', key);
      this.tokens.delete(key);
      return null;
    }

    console.log('✅ Retrieved Twitter request token:', { key, token: tokenData.token.substring(0, 10) + '...' });
    return {
      token: tokenData.token,
      tokenSecret: tokenData.tokenSecret
    };
  }

  // アクセストークン交換後のクリーンアップ
  removeRequestToken(key: string): void {
    const removed = this.tokens.delete(key);
    console.log('🗑️ Removed Twitter request token:', { key, removed });
  }

  // 期限切れトークンのクリーンアップ
  private cleanupExpiredTokens(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, tokenData] of this.tokens.entries()) {
      if (tokenData.expiresAt < now) {
        this.tokens.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log('🧹 Cleaned up expired Twitter tokens:', cleanedCount);
    }
  }

  // ランダムキー生成
  private generateKey(): string {
    return `twitter_oauth_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // 統計情報取得
  getStats(): { totalTokens: number; activeTokens: number } {
    const now = new Date();
    const activeTokens = Array.from(this.tokens.values()).filter(token => token.expiresAt >= now).length;
    
    return {
      totalTokens: this.tokens.size,
      activeTokens
    };
  }
}

export const twitterOAuthStore = TwitterOAuthStore.getInstance();