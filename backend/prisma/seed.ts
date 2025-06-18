import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // サンプルイベントデータ
  const sampleEvents = [
    {
      title: 'React Tokyo Meetup #15',
      description: 'React開発者のためのミートアップイベント。最新のReact技術について学びましょう。',
      start_datetime: new Date('2024-07-15T19:00:00+09:00'),
      end_datetime: new Date('2024-07-15T21:00:00+09:00'),
      location: '東京都渋谷区',
      venue_type: 'offline',
      site_url: 'https://react-tokyo.connpass.com/event/123456',
      tags: ['React', 'JavaScript', 'Frontend'],
    },
    {
      title: 'TypeScript Conference Japan 2024',
      description: '日本最大のTypeScriptカンファレンス。国内外の著名スピーカーが登壇します。',
      start_datetime: new Date('2024-08-20T10:00:00+09:00'),
      end_datetime: new Date('2024-08-20T18:00:00+09:00'),
      location: 'オンライン開催',
      venue_type: 'online',
      site_url: 'https://typescript-jp.org/conference/2024',
      tags: ['TypeScript', 'JavaScript', 'Conference'],
    },
    {
      title: 'Node.js Hands-on Workshop',
      description: 'Node.jsの基礎から応用まで学べるハンズオンワークショップ。初心者歓迎！',
      start_datetime: new Date('2024-06-30T13:00:00+09:00'),
      end_datetime: new Date('2024-06-30T17:00:00+09:00'),
      location: '大阪府大阪市',
      venue_type: 'hybrid',
      site_url: 'https://nodejs-workshop.example.com',
      tags: ['Node.js', 'JavaScript', 'Backend', 'Workshop'],
    },
    {
      title: 'Web Accessibility Conference',
      description: 'ウェブアクセシビリティについて学ぶカンファレンス。誰もが使いやすいウェブを目指して。',
      start_datetime: new Date('2024-09-10T09:30:00+09:00'),
      end_datetime: new Date('2024-09-10T17:30:00+09:00'),
      location: '東京都千代田区',
      venue_type: 'offline',
      site_url: 'https://web-a11y-conf.jp',
      tags: ['Accessibility', 'Web', 'UX'],
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