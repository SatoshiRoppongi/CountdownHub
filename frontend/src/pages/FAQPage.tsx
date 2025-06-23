import React, { useState } from 'react';

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    category: 'general',
    question: 'CountdownHubとはどのようなサービスですか？',
    answer: 'CountdownHubは、日本全国のイベント情報を集約し、開催日時までのカウントダウンを表示するWebサービスです。コンサート、展示会、スポーツイベント、セミナーなど様々なイベントの情報を一箇所で確認でき、気になるイベントをお気に入りに登録して管理することができます。'
  },
  {
    id: 2,
    category: 'general',
    question: 'サービスの利用は無料ですか？',
    answer: 'はい、CountdownHubは基本的に無料でご利用いただけます。イベントの閲覧、検索、お気に入り登録、コメント投稿などの機能は全て無料です。'
  },
  {
    id: 3,
    category: 'account',
    question: 'アカウント登録は必要ですか？',
    answer: 'イベントの閲覧や検索は登録なしでもご利用いただけます。ただし、お気に入り登録、コメント投稿、イベント作成などの機能をご利用いただくには、アカウント登録が必要です。'
  },
  {
    id: 4,
    category: 'account',
    question: 'どのような方法でアカウント登録できますか？',
    answer: 'Googleアカウントを使用したソーシャルログインでアカウント登録ができます。既存のGoogleアカウントを使用することで、簡単かつ安全にご登録いただけます。'
  },
  {
    id: 5,
    category: 'events',
    question: 'イベントを投稿することはできますか？',
    answer: 'はい、アカウント登録後にイベントを投稿することができます。イベント名、開催日時、場所、説明文、タグなどの情報を入力して投稿してください。投稿されたイベントは運営側で確認後に公開されます。'
  },
  {
    id: 6,
    category: 'events',
    question: 'どのような種類のイベントを投稿できますか？',
    answer: '公序良俗に反しない健全なイベントであれば、ジャンルを問わず投稿いただけます。コンサート、展示会、セミナー、ワークショップ、スポーツイベント、オンラインイベントなど様々な種類のイベントに対応しています。'
  },
  {
    id: 7,
    category: 'events',
    question: 'イベント情報を修正したい場合はどうすればよいですか？',
    answer: '自分が投稿したイベントについては、イベント詳細ページから編集することができます。他の人が投稿したイベントについて修正が必要な場合は、お問い合わせフォームからご連絡ください。'
  },
  {
    id: 8,
    category: 'search',
    question: 'イベントを効率的に探すにはどうすればよいですか？',
    answer: '以下の方法でイベントを探すことができます：\n1. キーワード検索：イベント名や説明文から検索\n2. タグ検索：ジャンルや特徴でフィルタリング\n3. 開催形式検索：オンライン、オフライン、ハイブリッドで絞り込み\n4. 開催日検索：期間を指定して検索\n5. 時間軸タブ：当日開催、今後開催、開催中、終了済みで分類'
  },
  {
    id: 9,
    category: 'search',
    question: '過去のイベントも見ることができますか？',
    answer: 'はい、「終了済み」タブから過去に開催されたイベントを閲覧することができます。過去のイベントでも詳細情報やコメントを確認できるため、今後の参考にしていただけます。'
  },
  {
    id: 10,
    category: 'features',
    question: 'お気に入り機能はどのように使いますか？',
    answer: 'アカウント登録後、気になるイベントのハートマークをクリックすることでお気に入りに登録できます。お気に入りに登録したイベントは、マイページから一覧で確認することができます。'
  },
  {
    id: 11,
    category: 'features',
    question: 'コメント機能について教えてください',
    answer: 'アカウント登録後、各イベントページでコメントを投稿することができます。イベントに関する質問や感想、参加予定の表明などにご利用ください。不適切なコメントは運営側で削除される場合があります。'
  },
  {
    id: 12,
    category: 'technical',
    question: '推奨ブラウザを教えてください',
    answer: 'Google Chrome、Firefox、Safari、Microsoft Edgeの最新版でのご利用を推奨しています。Internet Explorerには対応しておりません。'
  },
  {
    id: 13,
    category: 'technical',
    question: 'スマートフォンでも利用できますか？',
    answer: 'はい、スマートフォンやタブレットでもご利用いただけます。レスポンシブデザインにより、画面サイズに応じて最適化された表示になります。'
  },
  {
    id: 14,
    category: 'technical',
    question: 'ページが正しく表示されない場合はどうすればよいですか？',
    answer: '以下の方法をお試しください：\n1. ブラウザの再読み込み（F5キーまたはCmd+R）\n2. ブラウザのキャッシュとCookieの削除\n3. 別のブラウザでの確認\n4. インターネット接続の確認\n改善されない場合は、お問い合わせフォームからご連絡ください。'
  },
  {
    id: 15,
    category: 'support',
    question: '不具合を見つけた場合はどうすればよいですか？',
    answer: 'お問い合わせフォームから不具合報告をお送りください。以下の情報を含めていただくと、迅速な対応が可能です：\n- 使用しているブラウザとバージョン\n- 発生した操作手順\n- エラーメッセージ（表示された場合）\n- 発生日時'
  },
  {
    id: 16,
    category: 'support',
    question: '機能追加の要望はできますか？',
    answer: 'はい、機能追加のご要望をお待ちしています。お問い合わせフォームから詳細をお聞かせください。ご要望の内容によっては、今後のアップデートで実装を検討いたします。'
  }
];

const categories = [
  { key: 'all', label: 'すべて' },
  { key: 'general', label: 'サービス概要' },
  { key: 'account', label: 'アカウント' },
  { key: 'events', label: 'イベント投稿' },
  { key: 'search', label: '検索・閲覧' },
  { key: 'features', label: '機能について' },
  { key: 'technical', label: '技術的な問題' },
  { key: 'support', label: 'サポート' }
];

export const FAQPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const filteredFAQ = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">よくある質問（FAQ）</h1>
        <p className="text-gray-600 mb-8">
          CountdownHubについてよく寄せられる質問をまとめました。
          お探しの情報が見つからない場合は、お問い合わせフォームからご連絡ください。
        </p>

        {/* 検索ボックス */}
        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            キーワード検索
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="質問や回答からキーワードを検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* カテゴリ選択 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ一覧 */}
        <div className="space-y-4">
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">
                    {item.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openItems.includes(item.id) ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openItems.includes(item.id) && (
                  <div className="px-6 pb-4 text-gray-700 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                該当する質問が見つかりません
              </h3>
              <p className="text-gray-600 mb-4">
                検索キーワードやカテゴリを変更してお試しください。
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                検索条件をリセット
              </button>
            </div>
          )}
        </div>

        {/* お問い合わせ案内 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              お探しの情報が見つかりませんでしたか？
            </h2>
            <p className="text-blue-800 mb-4">
              ご質問やご不明な点がございましたら、お気軽にお問い合わせください。
              専門スタッフが丁寧にサポートいたします。
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              お問い合わせフォームへ
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};