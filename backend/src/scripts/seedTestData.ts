import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// テストデータ用の配列
const eventNames = [
  'React勉強会 - Hooks完全マスター',
  'TypeScript入門ワークショップ',
  'Next.js実践開発セミナー',
  'Node.js バックエンド構築講座',
  'GraphQL APIハンズオン',
  'AWS クラウド活用セミナー',
  'Docker & Kubernetes入門',
  'Python機械学習勉強会',
  'Vue.js コンポーネント設計',
  'Angular フレームワーク実践',
  'フロントエンド最新技術トレンド',
  'データベース設計パターン',
  'セキュリティエンジニア養成講座',
  'アジャイル開発プラクティス',
  'UI/UXデザイン基礎',
  'モバイルアプリ開発入門',
  'ブロックチェーン技術概論',
  'AI・機械学習実装ハンズオン',
  'マイクロサービス設計パターン',
  'DevOps文化と実践',
  '春の桜まつり 2024',
  '夏の花火大会',
  '秋の紅葉ハイキング',
  '冬のイルミネーション見学',
  'プログラミングコンテスト',
  'ハッカソン大会',
  'スタートアップピッチイベント',
  'テックカンファレンス',
  'オープンソース開発者会議',
  'クリエイター交流会',
  'デザイナーズミートアップ',
  'エンジニア転職相談会',
  'フリーランス活動セミナー',
  'リモートワーク効率化講座',
  '副業プログラミング入門',
  'キャリアアップ戦略セミナー',
  '新人エンジニア歓迎会',
  'ベテラン開発者座談会',
  'コードレビュー勉強会',
  'テスト駆動開発実践',
  'Clean Code読書会',
  'アルゴリズム問題解決',
  'データ構造完全理解',
  'システム設計面接対策',
  'ポートフォリオ作成講座',
  'GitHub活用テクニック',
  'オープンソース貢献入門',
  'コミュニティ運営ノウハウ',
  'メンタリング技術向上',
  'チーム開発ベストプラクティス'
];

const eventDescriptions = [
  'プログラミング初心者から上級者まで幅広く学べる内容です。実際のコードを書きながら理解を深めましょう。',
  '実務で役立つ技術とベストプラクティスを学習します。経験豊富な講師による丁寧な指導が受けられます。',
  'ハンズオン形式で実際にアプリケーションを作成します。参加者同士の交流も楽しめるイベントです。',
  '最新の技術トレンドとその活用方法について詳しく解説します。質疑応答の時間も十分に設けています。',
  '基礎から応用まで段階的に学習できるカリキュラムです。初心者の方も安心してご参加ください。',
  '現場の経験談を交えながら実践的な内容をお届けします。ネットワーキングの機会もあります。',
  '理論だけでなく実際のプロジェクトでの活用例も紹介します。持ち帰って即実践できる内容です。',
  'インタラクティブな形式で楽しく学習できます。参加者の皆様との活発な議論を期待しています。',
  '専門性の高い内容を分かりやすく解説します。資料は後日配布いたします。',
  '業界の第一線で活躍する講師による貴重な講演です。キャリア形成のヒントも得られます。'
];

const locations = [
  '東京都渋谷区',
  '東京都新宿区',
  '東京都品川区',
  '大阪府大阪市',
  '愛知県名古屋市',
  '福岡県福岡市',
  '北海道札幌市',
  '神奈川県横浜市',
  '兵庫県神戸市',
  '京都府京都市',
  'オンライン開催',
  'ハイブリッド開催'
];

const commentTexts = [
  'とても勉強になりました！次回も参加したいです。',
  '内容が充実していて満足です。ありがとうございました。',
  '初心者にも分かりやすい説明でした。',
  '実践的な内容で即活用できそうです。',
  '講師の方の説明が丁寧で理解しやすかったです。',
  '参加者同士の交流も楽しかったです。',
  '時間があっという間に過ぎました。',
  '質問にも親切に答えていただきありがとうございます。',
  '新しい発見がたくさんありました。',
  'おすすめのイベントです！',
  '準備が大変そうですが頑張ってください！',
  '楽しみにしています。',
  '詳細情報を教えてください。',
  '友人も誘って参加します。',
  'リモート参加は可能ですか？',
  '資料の配布はありますか？',
  '駐車場の情報を教えてください。',
  '当日の持ち物を確認したいです。',
  '録画の配信予定はありますか？',
  'SNSでの実況は可能ですか？'
];

const userNames = [
  { username: 'developer_taro', display_name: '開発太郎', email: 'taro@example.com' },
  { username: 'coder_hanako', display_name: 'コーダー花子', email: 'hanako@example.com' },
  { username: 'engineer_john', display_name: 'エンジニア太郎', email: 'john@example.com' },
  { username: 'programmer_alice', display_name: 'プログラマーアリス', email: 'alice@example.com' },
  { username: 'frontend_bob', display_name: 'フロントエンドボブ', email: 'bob@example.com' },
  { username: 'backend_carol', display_name: 'バックエンドキャロル', email: 'carol@example.com' },
  { username: 'fullstack_dave', display_name: 'フルスタックデイブ', email: 'dave@example.com' },
  { username: 'devops_eve', display_name: 'DevOpsイブ', email: 'eve@example.com' },
  { username: 'ui_designer_frank', display_name: 'UIデザイナーフランク', email: 'frank@example.com' },
  { username: 'data_scientist_grace', display_name: 'データサイエンティストグレース', email: 'grace@example.com' },
  { username: 'mobile_dev_henry', display_name: 'モバイル開発ヘンリー', email: 'henry@example.com' },
  { username: 'ai_researcher_iris', display_name: 'AI研究者アイリス', email: 'iris@example.com' },
  { username: 'security_expert_jack', display_name: 'セキュリティ専門家ジャック', email: 'jack@example.com' },
  { username: 'product_manager_kate', display_name: 'プロダクトマネージャーケイト', email: 'kate@example.com' }
];

async function seedTestData() {
  console.log('🌱 テストデータの生成を開始します...');

  // 既存のデータを削除
  console.log('🗑️ 既存データをクリアしています...');
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.event.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.user.deleteMany();

  // 管理者ユーザーの作成
  console.log('👑 管理者ユーザーを作成中...');
  const adminUser = await prisma.user.create({
    data: {
      id: 'admin-user-001',
      email: 'admin@countdownhub.com',
      username: 'admin',
      display_name: '管理者',
      password: await bcrypt.hash('admin123', 10),
      auth_provider: 'local',
    }
  });

  // 一般ユーザーの作成
  console.log('👤 一般ユーザーを作成中...');
  const regularUsers = [];
  for (let i = 0; i < userNames.length; i++) {
    const userData = userNames[i];
    const user = await prisma.user.create({
      data: {
        id: `user-${String(i + 1).padStart(3, '0')}`,
        email: userData.email,
        username: userData.username,
        display_name: userData.display_name,
        password: await bcrypt.hash('password123', 10),
        auth_provider: Math.random() > 0.7 ? 'google' : 'local',
      }
    });
    regularUsers.push(user);
  }

  const allUsers = [adminUser, ...regularUsers];

  // 通知設定を作成
  console.log('🔔 通知設定を作成中...');
  for (const user of allUsers) {
    await prisma.notificationSettings.create({
      data: {
        user_id: user.id,
        email_enabled: Math.random() > 0.3,
        browser_enabled: Math.random() > 0.2,
        event_reminders: Math.random() > 0.4,
        comment_notifications: Math.random() > 0.6,
        event_updates: Math.random() > 0.3,
        weekly_digest: Math.random() > 0.5,
      }
    });
  }

  // イベントの作成
  console.log('📅 イベントを作成中...');
  const events = [];
  const now = new Date();

  for (let i = 0; i < 80; i++) {
    const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];
    const description = eventDescriptions[Math.floor(Math.random() * eventDescriptions.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const creator = allUsers[Math.floor(Math.random() * allUsers.length)];

    // 過去、現在、未来のイベントをランダムに配置
    let startDate: Date;
    if (i < 25) {
      // 過去のイベント (約30%)
      startDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // 0-90日前
    } else if (i < 30) {
      // 現在進行中のイベント (約6%)
      startDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 0-7日前
    } else {
      // 未来のイベント (約64%)
      startDate = new Date(now.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000); // 0-180日後
    }

    const duration = (1 + Math.random() * 4) * 60 * 60 * 1000; // 1-5時間
    const endDate = new Date(startDate.getTime() + duration);

    const event = await prisma.event.create({
      data: {
        title: `${eventName} #${i + 1}`,
        description: `${description}\n\n開催場所: ${location}\n定員: ${Math.floor(Math.random() * 100) + 20}名\n参加費: ${Math.random() > 0.5 ? '無料' : `${Math.floor(Math.random() * 5) * 1000}円`}`,
        start_datetime: startDate,
        end_datetime: endDate,
        location: location,
        venue_type: location.includes('オンライン') ? 'online' : location.includes('ハイブリッド') ? 'hybrid' : 'offline',
        user_id: creator.id,
        tags: ['プログラミング', '勉強会', 'IT'].slice(0, Math.floor(Math.random() * 3) + 1),
        site_url: Math.random() > 0.5 ? `https://example.com/event-${i + 1}` : null,
        image_url: Math.random() > 0.7 ? `https://picsum.photos/800/400?random=${i}` : null
      }
    });
    events.push(event);
  }

  // コメントの作成
  console.log('💬 コメントを作成中...');
  for (const event of events) {
    const commentCount = Math.floor(Math.random() * 9) + 2; // 2-10個のコメント
    for (let i = 0; i < commentCount; i++) {
      const commenter = allUsers[Math.floor(Math.random() * allUsers.length)];
      const commentText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      
      await prisma.comment.create({
        data: {
          event_id: event.id,
          user_id: commenter.id,
          author_name: commenter.display_name,
          content: commentText,
          is_reported: Math.random() > 0.98, // 2%が報告済み
        }
      });
    }
  }

  // お気に入りの作成
  console.log('⭐ お気に入りを作成中...');
  for (const user of allUsers) {
    const favoriteCount = Math.floor(Math.random() * 15) + 5; // 5-19個のお気に入り
    const shuffledEvents = [...events].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(favoriteCount, events.length); i++) {
      try {
        await prisma.favorite.create({
          data: {
            user_id: user.id,
            event_id: shuffledEvents[i].id,
          }
        });
      } catch (error) {
        // 重複エラーを無視
      }
    }
  }

  // お知らせの作成
  console.log('📢 お知らせを作成中...');
  const announcements = [
    {
      title: 'システムメンテナンスのお知らせ',
      content: '2024年6月30日(日) 2:00-6:00にシステムメンテナンスを実施いたします。この間、サービスがご利用いただけません。',
      type: 'maintenance' as const,
      priority: 'high' as const,
    },
    {
      title: '新機能：イベント検索機能を追加しました',
      content: 'より便利にイベントを見つけられるよう、高度な検索機能を追加いたしました。ぜひご活用ください。',
      type: 'feature' as const,
      priority: 'normal' as const,
    },
    {
      title: '重要：パスワードポリシーの変更について',
      content: 'セキュリティ強化のため、パスワードポリシーを変更いたします。次回ログイン時に新しいパスワードの設定をお願いします。',
      type: 'warning' as const,
      priority: 'urgent' as const,
    },
    {
      title: 'お得なプレミアムプランをリリース',
      content: 'より多くの機能をご利用いただけるプレミアムプランをリリースしました。初月無料キャンペーン実施中です。',
      type: 'info' as const,
      priority: 'low' as const,
    },
    {
      title: '緊急：セキュリティアップデート完了',
      content: '本日発見されたセキュリティ問題に対するアップデートが完了いたしました。ご安心してサービスをご利用ください。',
      type: 'emergency' as const,
      priority: 'urgent' as const,
    },
    {
      title: 'ゴールデンウィーク期間中のサポートについて',
      content: 'ゴールデンウィーク期間中(4/29-5/5)のサポート対応は限定的となります。ご了承ください。',
      type: 'info' as const,
      priority: 'normal' as const,
    },
    {
      title: 'アプリ版がリリースされました',
      content: 'iOS・Android向けのアプリがリリースされました。App Store・Google Playからダウンロードできます。',
      type: 'feature' as const,
      priority: 'high' as const,
    },
    {
      title: 'コミュニティガイドライン更新',
      content: 'より良いコミュニティ環境のため、ガイドラインを更新いたしました。詳細をご確認ください。',
      type: 'info' as const,
      priority: 'normal' as const,
    }
  ];

  for (const announcementData of announcements) {
    await prisma.announcement.create({
      data: {
        ...announcementData,
        is_active: Math.random() > 0.2, // 80%がアクティブ
        start_date: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 0-30日前から開始
        end_date: Math.random() > 0.5 ? new Date(now.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000) : null, // 50%に終了日設定
        created_by: adminUser.id,
      }
    });
  }

  // お問い合わせの作成
  console.log('📝 お問い合わせを作成中...');
  const contacts = [
    {
      name: '田中太郎',
      email: 'tanaka@example.com',
      subject: 'イベント作成について',
      category: 'general' as const,
      message: 'イベントの作成方法について教えてください。',
      status: 'pending' as const,
    },
    {
      name: '佐藤花子',
      email: 'sato@example.com',
      subject: 'ログインできません',
      category: 'technical' as const,
      message: 'パスワードを忘れてしまい、ログインできません。',
      status: 'in_progress' as const,
    },
    {
      name: '山田次郎',
      email: 'yamada@example.com',
      subject: 'イベントページが表示されない',
      category: 'bug' as const,
      message: '特定のイベントページが表示されません。',
      status: 'resolved' as const,
    },
    {
      name: '鈴木三郎',
      email: 'suzuki@example.com',
      subject: '新機能の提案',
      category: 'feature' as const,
      message: 'カレンダー表示機能があると便利だと思います。',
      status: 'pending' as const,
    },
    {
      name: '高橋四郎',
      email: 'takahashi@example.com',
      subject: 'アカウント削除について',
      category: 'account' as const,
      message: 'アカウントを削除したいのですが、方法を教えてください。',
      status: 'closed' as const,
    },
    {
      name: '伊藤五郎',
      email: 'ito@example.com',
      subject: 'その他の質問',
      category: 'other' as const,
      message: '利用規約について質問があります。',
      status: 'pending' as const,
    }
  ];

  for (const contactData of contacts) {
    await prisma.contact.create({
      data: contactData
    });
  }

  // 通知の作成
  console.log('🔔 通知を作成中...');
  const notificationTypes = [
    'event_starting_soon',
    'event_started', 
    'new_comment',
    'comment_reply',
    'event_updated',
    'event_cancelled',
    'favorite_event_reminder',
    'event_trending',
    'weekly_digest',
    'system_maintenance',
    'feature_announcement'
  ] as const;

  for (const user of allUsers) {
    const notificationCount = Math.floor(Math.random() * 8) + 3; // 3-10個の通知
    for (let i = 0; i < notificationCount; i++) {
      const notificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const event = events[Math.floor(Math.random() * events.length)];
      
      await prisma.notification.create({
        data: {
          user_id: user.id,
          type: notificationType,
          title: `${event.title}に関する通知`,
          message: `${event.title}についてお知らせがあります。`,
          read: Math.random() > 0.4,
          action_url: `/events/${event.id}`,
          action_text: '詳細を見る',
          event_id: event.id,
          created_at: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 0-30日前
        }
      });
    }
  }

  console.log('✅ テストデータの生成が完了しました！');
  console.log(`📊 生成されたデータ:`);
  console.log(`   👤 ユーザー: ${allUsers.length}名 (管理者: 1名, 一般: ${regularUsers.length}名)`);
  console.log(`   📅 イベント: ${events.length}件`);
  console.log(`   💬 コメント: 約${events.length * 6}件`);
  console.log(`   ⭐ お気に入り: 約${allUsers.length * 10}件`);
  console.log(`   📢 お知らせ: ${announcements.length}件`);
  console.log(`   📝 お問い合わせ: ${contacts.length}件`);
  console.log(`   🔔 通知: 約${allUsers.length * 6}件`);
  console.log('');
  console.log('🔑 管理者アカウント:');
  console.log('   メールアドレス: admin@countdownhub.com');
  console.log('   パスワード: admin123');
  console.log('');
  console.log('🔑 一般ユーザーアカウント例:');
  console.log('   メールアドレス: taro@example.com');
  console.log('   パスワード: password123');
}

async function main() {
  try {
    await seedTestData();
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();