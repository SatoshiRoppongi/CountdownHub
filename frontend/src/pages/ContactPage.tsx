import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useContact } from '../hooks/useContact';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const { showSuccess, showError } = useToast();
  const contactMutation = useContact();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('お名前を入力してください');
    } else if (formData.name.length > 100) {
      errors.push('お名前は100文字以下で入力してください');
    }
    
    if (!formData.email.trim()) {
      errors.push('メールアドレスを入力してください');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('有効なメールアドレスを入力してください');
    }
    
    if (!formData.subject.trim()) {
      errors.push('件名を入力してください');
    } else if (formData.subject.length > 255) {
      errors.push('件名は255文字以下で入力してください');
    }
    
    if (!formData.category) {
      errors.push('カテゴリを選択してください');
    }
    
    if (!formData.message.trim()) {
      errors.push('お問い合わせ内容を入力してください');
    } else if (formData.message.length < 10) {
      errors.push('お問い合わせ内容は10文字以上で入力してください');
    } else if (formData.message.length > 10000) {
      errors.push('お問い合わせ内容は10000文字以下で入力してください');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // フロントエンドバリデーション
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showError(`入力内容を確認してください:\n\n${validationErrors.join('\n')}`);
      return;
    }

    try {
      await contactMutation.mutateAsync(formData);
      showSuccess('お問い合わせを送信しました。返信まで今しばらくお待ちください。');
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (error) {
      console.error('Contact form error:', error);
      const errorMessage = error instanceof Error ? error.message : '送信に失敗しました。時間をおいて再度お試しください。';
      showError(errorMessage);
    }
  };

  const isFormValid = formData.name && formData.email && formData.subject && formData.category && formData.message;
  const isSubmitting = contactMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">お問い合わせ</h1>
        
        <div className="mb-8">
          <p className="text-gray-700 leading-relaxed mb-4">
            CountdownHubに関するご質問、ご要望、不具合報告など、お気軽にお問い合わせください。
            内容を確認の上、担当者より回答いたします。
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>返信について：</strong>お問い合わせ内容により、返信にお時間をいただく場合がございます。予めご了承ください。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              お問い合わせ種別 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              <option value="general">一般的な質問</option>
              <option value="technical">技術的な問題</option>
              <option value="bug">不具合報告</option>
              <option value="feature">機能追加要望</option>
              <option value="account">アカウントに関する問題</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              件名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="お問い合わせの件名を入力してください"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              お問い合わせ内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder="お問い合わせ内容を詳しくご記入ください。&#10;&#10;不具合報告の場合は、以下の情報もお聞かせください：&#10;- 使用しているブラウザ&#10;- 操作手順&#10;- エラーメッセージ（表示された場合）"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">個人情報の取り扱いについて</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              お問い合わせフォームで入力された個人情報は、お問い合わせへの回答のみに使用いたします。
              詳細については、<a href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</a>をご確認ください。
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                isFormValid && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </span>
              ) : (
                '送信する'
              )}
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">その他のお問い合わせ方法</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">よくある質問</h3>
              <p className="text-sm text-gray-600 mb-3">
                お問い合わせ前に、よくある質問をご確認ください。
              </p>
              <a href="/faq" className="text-blue-600 hover:underline text-sm font-medium">
                FAQを見る →
              </a>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Twitter</h3>
              <p className="text-sm text-gray-600 mb-3">
                最新情報やお知らせはTwitterでも発信しています。
              </p>
              <a href="https://x.com/countdownhub321" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                @countdownhub321 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};