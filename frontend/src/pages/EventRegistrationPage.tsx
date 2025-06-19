import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateEvent, useEvent, useUpdateEvent } from '../hooks/useEvents';
import { Event } from '../types';

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  venue_type: 'online' | 'offline' | 'hybrid' | '';
  site_url: string;
  image_url: string;
  tags: string;
}

export const EventRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get('edit');
  const isEditMode = !!editEventId;
  
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const { data: editEvent, isLoading: isLoadingEvent } = useEvent(
    editEventId ? parseInt(editEventId, 10) : 0
  );
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    venue_type: '',
    site_url: '',
    image_url: '',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 編集時にフォームデータを初期化
  useEffect(() => {
    if (isEditMode && editEvent) {
      const startDate = new Date(editEvent.start_datetime);
      const endDate = editEvent.end_datetime ? new Date(editEvent.end_datetime) : null;
      
      setFormData({
        title: editEvent.title || '',
        description: editEvent.description || '',
        start_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate ? endDate.toISOString().split('T')[0] : '',
        end_time: endDate ? endDate.toTimeString().slice(0, 5) : '',
        location: editEvent.location || '',
        venue_type: editEvent.venue_type || '',
        site_url: editEvent.site_url || '',
        image_url: editEvent.image_url || '',
        tags: editEvent.tags ? editEvent.tags.join(', ') : '',
      });
    }
  }, [isEditMode, editEvent]);

  // 日付と時間を組み合わせてISO文字列に変換
  const combineDateAndTime = (date: string, time: string): string => {
    if (!date) return '';
    
    // 時間が未設定の場合は00:00を使用
    const finalTime = time || '00:00';
    const datetime = new Date(`${date}T${finalTime}`);
    return datetime.toISOString();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // タイトル検証
    if (!formData.title.trim()) {
      newErrors.title = 'イベントタイトルは必須です';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'タイトルは3文字以上で入力してください';
    }

    // 開始日付検証
    if (!formData.start_date) {
      newErrors.start_date = '開始日は必須です';
    } else {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.start_date = '開始日は今日以降の日付を選択してください';
      }
    }

    // 終了日時検証（設定されている場合）
    if (formData.end_date) {
      const startDatetime = combineDateAndTime(formData.start_date, formData.start_time);
      const endDatetime = combineDateAndTime(formData.end_date, formData.end_time);
      
      if (startDatetime && endDatetime) {
        const startDate = new Date(startDatetime);
        const endDate = new Date(endDatetime);
        
        if (endDate <= startDate) {
          newErrors.end_date = '終了日時は開始日時より後に設定してください';
        }
      }
    }

    // URL検証
    if (formData.site_url && !isValidUrl(formData.site_url)) {
      newErrors.site_url = '有効なURLを入力してください（https://example.com）';
    }

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = '有効な画像URLを入力してください（https://example.com/image.jpg）';
    }

    // 開催形式と場所の整合性チェック
    if (formData.venue_type === 'online' && !formData.location.trim()) {
      newErrors.location = 'オンライン開催の場合、開催場所に「オンライン開催」などを入力してください';
    }

    if (formData.venue_type === 'offline' && !formData.location.trim()) {
      newErrors.location = 'オフライン開催の場合、具体的な開催場所を入力してください';
    }

    // タグ検証
    if (formData.tags) {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tags.length > 10) {
        newErrors.tags = 'タグは10個以下にしてください';
      }
      
      for (const tag of tags) {
        if (tag.length > 20) {
          newErrors.tags = '各タグは20文字以下にしてください';
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const startDatetime = combineDateAndTime(formData.start_date, formData.start_time);
    const endDatetime = formData.end_date 
      ? combineDateAndTime(formData.end_date, formData.end_time)
      : null;

    const eventData: Partial<Event> = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      location: formData.location.trim() || null,
      venue_type: formData.venue_type || null,
      site_url: formData.site_url.trim() || null,
      image_url: formData.image_url.trim() || null,
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
    };

    console.log('Sending event data:', eventData);

    try {
      if (isEditMode && editEventId) {
        const updatedEvent = await updateEventMutation.mutateAsync({
          id: parseInt(editEventId, 10),
          data: eventData
        });
        navigate(`/events/${updatedEvent.id}`);
      } else {
        const createdEvent = await createEventMutation.mutateAsync(eventData);
        navigate(`/events/${createdEvent.id}`);
      }
    } catch (error: any) {
      console.error(`Event ${isEditMode ? 'update' : 'creation'} failed:`, error);
      console.error('Error response:', error.response?.data);
      // エラーメッセージを表示
      const errorMessage = error.response?.data?.errors?.length 
        ? error.response.data.errors.map((err: any) => err.msg).join(', ')
        : `イベントの${isEditMode ? '更新' : '登録'}に失敗しました。もう一度お試しください。`;
      setErrors({ submit: errorMessage });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 編集モードでデータ読み込み中の場合
  if (isEditMode && isLoadingEvent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ナビゲーション */}
      <nav className="mb-6">
        <Link 
          to="/"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← イベント一覧に戻る
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {isEditMode ? '✏️ イベントを編集' : '🎉 新しいイベントを登録'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* イベントタイトル */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                イベントタイトル *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="イベントのタイトルを入力してください"
                maxLength={255}
                required
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* イベント説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                イベント説明
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="イベントの詳細説明を入力してください"
                rows={4}
              />
            </div>

            {/* 開始日時 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">📅 開催日時</h3>
              
              {/* 開始日時 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">開始日時 *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="start_date" className="block text-xs font-medium text-gray-600 mb-1">
                      開始日 *
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.start_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.start_date && (
                      <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="start_time" className="block text-xs font-medium text-gray-600 mb-1">
                      開始時間（オプション）
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">未設定の場合は0:00になります</p>
                  </div>
                </div>
              </div>

              {/* 終了日時 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">終了日時（オプション）</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="end_date" className="block text-xs font-medium text-gray-600 mb-1">
                      終了日
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.end_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.end_date && (
                      <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="end_time" className="block text-xs font-medium text-gray-600 mb-1">
                      終了時間
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">未設定の場合は0:00になります</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 開催場所と形式 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  開催場所
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="東京都渋谷区、オンライン開催 など"
                  maxLength={255}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>

              <div>
                <label htmlFor="venue_type" className="block text-sm font-medium text-gray-700 mb-2">
                  開催形式
                </label>
                <select
                  id="venue_type"
                  name="venue_type"
                  value={formData.venue_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  <option value="online">オンライン</option>
                  <option value="offline">オフライン</option>
                  <option value="hybrid">ハイブリッド</option>
                </select>
              </div>
            </div>

            {/* URL情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="site_url" className="block text-sm font-medium text-gray-700 mb-2">
                  公式サイトURL
                </label>
                <input
                  type="url"
                  id="site_url"
                  name="site_url"
                  value={formData.site_url}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.site_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                />
                {errors.site_url && (
                  <p className="text-red-500 text-sm mt-1">{errors.site_url}</p>
                )}
              </div>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                  画像URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.image_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/image.jpg"
                />
                {errors.image_url && (
                  <p className="text-red-500 text-sm mt-1">{errors.image_url}</p>
                )}
              </div>
            </div>

            {/* タグ */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                タグ
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.tags ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="React, JavaScript, Frontend（カンマ区切り）"
              />
              {errors.tags ? (
                <p className="text-red-500 text-sm mt-1">{errors.tags}</p>
              ) : (
                <p className="text-gray-500 text-sm mt-1">
                  複数のタグはカンマで区切って入力してください（最大10個、各タグ20文字以下）
                </p>
              )}
            </div>

            {/* 送信エラーメッセージ */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to="/"
                className="px-6 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={createEventMutation.isPending || updateEventMutation.isPending}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {(createEventMutation.isPending || updateEventMutation.isPending) 
                  ? (isEditMode ? '更新中...' : '登録中...') 
                  : (isEditMode ? 'イベントを更新' : 'イベントを登録')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};