import { PrismaClient, VenueType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // サンプルイベントデータ（現在から近い未来の日付）
  const now = new Date();
  const sampleEvents = [
    {
      title: 'React Tokyo Meetup #15',
      description: 'React開発者のためのミートアップイベント。最新のReact技術について学びましょう。',
      start_datetime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2日後
      end_datetime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2日後+2時間
      location: '東京都渋谷区',
      venue_type: VenueType.offline,
      site_url: 'https://react-tokyo.connpass.com/event/123456',
      tags: ['React', 'JavaScript', 'Frontend'],
    },
    {
      title: 'TypeScript Conference Japan 2025',
      description: '日本最大のTypeScriptカンファレンス。国内外の著名スピーカーが登壇します。',
      start_datetime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30日後
      end_datetime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 30日後+8時間
      location: 'オンライン開催',
      venue_type: VenueType.online,
      site_url: 'https://typescript-jp.org/conference/2025',
      tags: ['TypeScript', 'JavaScript', 'Conference'],
    },
    {
      title: 'Node.js Hands-on Workshop',
      description: 'Node.jsの基礎から応用まで学べるハンズオンワークショップ。初心者歓迎！',
      start_datetime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7日後
      end_datetime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 7日後+4時間
      location: '大阪府大阪市',
      venue_type: VenueType.hybrid,
      site_url: 'https://nodejs-workshop.example.com',
      tags: ['Node.js', 'JavaScript', 'Backend', 'Workshop'],
    },
    {
      title: 'Web Accessibility Conference',
      description: 'ウェブアクセシビリティについて学ぶカンファレンス。誰もが使いやすいウェブを目指して。',
      start_datetime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14日後
      end_datetime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 14日後+8時間
      location: '東京都千代田区',
      venue_type: VenueType.offline,
      site_url: 'https://web-a11y-conf.jp',
      tags: ['Accessibility', 'Web', 'UX'],
    },
    {
      title: '緊急！明日のミートアップ',
      description: '急遽開催が決定したミートアップ。カウントダウンテスト用のイベントです。',
      start_datetime: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23時間後
      end_datetime: new Date(now.getTime() + 25 * 60 * 60 * 1000), // 25時間後
      location: 'オンライン',
      venue_type: VenueType.online,
      site_url: 'https://example.com/urgent-meetup',
      tags: ['Urgent', 'Test', 'Meetup'],
    },
  ];

  console.log('Start seeding...');

  for (const event of sampleEvents) {
    const createdEvent = await prisma.event.create({
      data: event,
    });
    console.log(`Created event: ${createdEvent.title}`);

    // 各イベントにサンプルコメントを追加
    const sampleComments = [
      {
        event_id: createdEvent.id,
        author_name: '田中太郎',
        content: '参加予定です！楽しみにしています。',
      },
      {
        event_id: createdEvent.id,
        author_name: '佐藤花子',
        content: 'とても興味深いトピックですね。質問があります。',
      },
    ];

    for (const comment of sampleComments) {
      await prisma.comment.create({
        data: comment,
      });
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });