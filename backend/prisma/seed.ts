import { PrismaClient, VenueType } from '@prisma/client';

const prisma = new PrismaClient();

// ヘルパー関数
const getRandomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const getRandomChoices = <T>(array: T[], count: number): T[] => {
  const choices = [];
  for (let i = 0; i < count; i++) {
    choices.push(getRandomChoice(array));
  }
  return [...new Set(choices)]; // 重複を除去
};

const venueTypes = [VenueType.online, VenueType.offline, VenueType.hybrid];
const locations = ['東京都渋谷区', '大阪府大阪市', '愛知県名古屋市', '福岡県福岡市', '北海道札幌市', 'オンライン開催'];
const tagOptions = ['React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'Conference', 'Workshop', 'Meetup', 'Hackathon', 'AI', 'ML', 'Backend', 'Frontend', 'DevOps', 'Web3', 'Blockchain'];

async function main() {
  const now = new Date();
  console.log('Start seeding...');

  // データクリア
  await prisma.comment.deleteMany();
  await prisma.event.deleteMany();

  const allEvents = [];

  // 1. 当日未開催イベント（今日の夜の時間帯） - 15件
  console.log('Creating today upcoming events...');
  const todayEvents = [
    { title: '🚨 緊急開催！JavaScript勉強会', hours: 2, duration: 2 },
    { title: '⚡ 今夜限定 React LT大会', hours: 4, duration: 3 },
    { title: '🔥 深夜のTypeScript解説', hours: 6, duration: 2 },
    { title: '🌙 今日開催 Vue.js meetup', hours: 8, duration: 4 },
    { title: '⭐ 本日開催 AI/ML座談会', hours: 10, duration: 3 },
    { title: '🎯 今日中に学ぶ Go言語', hours: 12, duration: 5 },
    { title: '🚀 本日開催 Web3勉強会', hours: 14, duration: 2 },
    { title: '💻 今夜のプログラミング雑談', hours: 16, duration: 3 },
    { title: '🎉 本日限定 開発者交流会', hours: 18, duration: 4 },
    { title: '🔧 今日のDevOps入門', hours: 20, duration: 2 },
    { title: '📱 本日開催 モバイル開発', hours: 1, duration: 1 },
    { title: '🎨 今夜のUI/UX勉強会', hours: 3, duration: 2 },
    { title: '🧠 本日開催 アルゴリズム講座', hours: 5, duration: 3 },
    { title: '🌟 今日限定 フリーランス相談', hours: 7, duration: 2 },
    { title: '🎪 本日開催 技術カンファレンス', hours: 9, duration: 6 },
    // テスト用：アニメーション確認用イベント
    { title: '🧪 テスト: 30秒後開始', hours: 0, minutes: 0.5, duration: 1 },
    { title: '🧪 テスト: 2分後開始', hours: 0, minutes: 2, duration: 1 },
  ];

  for (const event of todayEvents) {
    const hoursOffset = event.hours || 0;
    const minutesOffset = (event as any).minutes || 0;
    const totalMinutes = hoursOffset * 60 + minutesOffset;
    
    allEvents.push({
      title: event.title,
      description: `本日開催予定のイベントです。${totalMinutes > 60 ? `${Math.floor(totalMinutes/60)}時間` : `${totalMinutes}分`}後に開始予定！`,
      start_datetime: new Date(now.getTime() + totalMinutes * 60 * 1000),
      end_datetime: new Date(now.getTime() + (totalMinutes + event.duration * 60) * 60 * 1000),
      location: getRandomChoice(locations),
      venue_type: getRandomChoice(venueTypes),
      site_url: `https://example.com/event-${Math.floor(Math.random() * 1000)}`,
      tags: getRandomChoices(tagOptions, Math.floor(Math.random() * 3) + 1),
    });
  }

  // 2. 明日以降のイベント - 20件
  console.log('Creating future events...');
  const futureEventTitles = [
    'React Tokyo Meetup #15', 'TypeScript Conference Japan 2025', 'Node.js Hands-on Workshop',
    'Web Accessibility Conference', 'Vue.js Tokyo', 'Angular Tokyo Meetup', 'GraphQL勉強会',
    'Docker & Kubernetes入門', 'AWS Summit Tokyo', 'Google Cloud Next', 'Microsoft Build',
    'GitHub Universe', 'PyCon Japan', 'RubyKaigi', 'JSConf Japan', 'DevFest Tokyo',
    'WordCamp Tokyo', 'DroidKaigi', 'iOSDC Japan', 'Tech Summit'
  ];

  for (let i = 0; i < 20; i++) {
    const daysFromNow = Math.floor(Math.random() * 30) + 1; // 1-30日後
    const startHour = Math.floor(Math.random() * 12) + 9; // 9-20時
    const duration = Math.floor(Math.random() * 6) + 2; // 2-7時間

    allEvents.push({
      title: futureEventTitles[i],
      description: `${daysFromNow}日後に開催予定のイベントです。最新の技術動向について学びましょう。`,
      start_datetime: new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000 + startHour * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000 + (startHour + duration) * 60 * 60 * 1000),
      location: getRandomChoice(locations),
      venue_type: getRandomChoice(venueTypes),
      site_url: `https://example.com/future-${i}`,
      tags: getRandomChoices(tagOptions, Math.floor(Math.random() * 4) + 1),
    });
  }

  // 3. 開催中イベント - 10件
  console.log('Creating ongoing events...');
  const ongoingEvents = [
    '🔴 LIVE: 開発者ライブ配信', '📺 生放送: コーディング実況', '🎬 配信中: 技術解説',
    '🔥 開催中: ハッカソン24h', '⚡ 進行中: オンライン勉強会', '🌟 配信中: プログラミング講座',
    '🎯 開催中: バグ修正大会', '💻 進行中: ペアプログラミング', '🎪 開催中: 技術カンファレンス',
    '🚀 配信中: スタートアップピッチ'
  ];

  for (let i = 0; i < 10; i++) {
    const startedHoursAgo = Math.floor(Math.random() * 4) + 1; // 1-4時間前に開始
    const totalDuration = Math.floor(Math.random() * 6) + 4; // 4-9時間の長さ

    allEvents.push({
      title: ongoingEvents[i],
      description: `現在開催中のイベントです。${startedHoursAgo}時間前に開始し、まだ継続中です。`,
      start_datetime: new Date(now.getTime() - startedHoursAgo * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() + (totalDuration - startedHoursAgo) * 60 * 60 * 1000),
      location: getRandomChoice(locations),
      venue_type: getRandomChoice(venueTypes),
      site_url: `https://example.com/live-${i}`,
      tags: getRandomChoices(tagOptions, Math.floor(Math.random() * 3) + 1),
    });
  }

  // 4. 終了イベント - 15件
  console.log('Creating past events...');
  const pastEventTitles = [
    '✅ 終了: React入門講座', '📝 完了: TypeScript基礎', '🎓 終了: Node.js実践',
    '🏆 完了: ハッカソン結果発表', '📊 終了: データ分析勉強会', '🎯 完了: アジャイル開発講座',
    '💡 終了: アイデアソン', '🔧 完了: ツール活用術', '📱 終了: アプリ開発入門',
    '🌐 完了: Web開発基礎', '🎨 終了: デザイン思考', '📈 完了: グロースハック',
    '🔒 終了: セキュリティ講座', '⚙️ 完了: インフラ構築', '🧪 終了: テスト駆動開発'
  ];

  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30日前
    const duration = Math.floor(Math.random() * 6) + 2; // 2-7時間

    allEvents.push({
      title: pastEventTitles[i],
      description: `${daysAgo}日前に開催されたイベントです。多くの参加者にご参加いただきました。`,
      start_datetime: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      end_datetime: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 + duration * 60 * 60 * 1000),
      location: getRandomChoice(locations),
      venue_type: getRandomChoice(venueTypes),
      site_url: `https://example.com/past-${i}`,
      tags: getRandomChoices(tagOptions, Math.floor(Math.random() * 3) + 1),
    });
  }

  // 全イベントをデータベースに挿入
  console.log(`Creating ${allEvents.length} events...`);
  
  for (const eventData of allEvents) {
    const createdEvent = await prisma.event.create({
      data: eventData,
    });
    console.log(`Created event: ${createdEvent.title}`);

    // 各イベントにランダムなコメントを追加
    const commentAuthors = ['田中太郎', '佐藤花子', '山田次郎', '鈴木一郎', '高橋美子', '渡辺健太', '中村さくら', '小林大輔'];
    const commentTemplates = [
      '参加予定です！楽しみにしています。',
      'とても興味深いトピックですね。質問があります。',
      '前回も参加しましたが、今回も期待しています！',
      'オンライン参加できるのが嬉しいです。',
      '初心者ですが参加して大丈夫でしょうか？',
      '資料の事前共有はありますか？',
      'ネットワーキングの時間もあると嬉しいです。',
      '録画配信の予定はありますか？',
      '素晴らしいイベントでした！ありがとうございました。',
      'また次回も参加したいと思います。'
    ];

    const numComments = Math.floor(Math.random() * 5) + 1; // 1-5個のコメント
    for (let i = 0; i < numComments; i++) {
      await prisma.comment.create({
        data: {
          event_id: createdEvent.id,
          author_name: getRandomChoice(commentAuthors),
          content: getRandomChoice(commentTemplates),
        },
      });
    }
  }

  console.log(`Seeding finished. Created ${allEvents.length} events with comments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });