import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateEvent, useEvent, useUpdateEvent } from '../hooks/useEvents';
import { Event } from '../types';
import { EnhancedFormField } from '../components/EnhancedFormField';
import { validateEventForm, validateFieldRealtime, EventFormData as ValidatedEventFormData } from '../utils/eventValidation';

// ValidatedEventFormDataを使用
type EventFormData = ValidatedEventFormData;

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
    is_public: true,
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
        is_public: editEvent.is_public !== undefined ? editEvent.is_public : true,
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
    const validation = validateEventForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
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
      venue_type: (formData.venue_type as 'online' | 'offline' | 'hybrid') || null,
      site_url: formData.site_url.trim() || null,
      image_url: formData.image_url.trim() || null,
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
      is_public: formData.is_public,
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
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    // Handle boolean values for checkboxes/radio buttons
    if (type === 'radio' && name === 'is_public') {
      newValue = value === 'true';
    }
    
    const newFormData = { ...formData, [name]: newValue };
    setFormData(newFormData);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // リアルタイムバリデーション用ハンドラー
  const handleFieldValidation = (fieldName: keyof EventFormData, value: string) => {
    return validateFieldRealtime(fieldName, value, formData);
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
            <EnhancedFormField
              label="イベントタイトル"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              onValidate={(value) => handleFieldValidation('title', value)}
              placeholder="イベントのタイトルを入力してください"
              required
              error={errors.title}
              maxLength={100}
              helperText="3文字以上100文字以内で入力してください"
              icon="🎉"
            />

            {/* イベント説明 */}
            <EnhancedFormField
              label="イベント説明"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={handleInputChange}
              onValidate={(value) => handleFieldValidation('description', value)}
              placeholder="イベントの詳細説明を入力してください（任意）"
              error={errors.description}
              maxLength={2000}
              rows={4}
              helperText="イベントの内容、対象者、持ち物などを詳しく説明してください"
              icon="📝"
            />

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
              <EnhancedFormField
                label="開催場所"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                onValidate={(value) => handleFieldValidation('location', value)}
                placeholder="東京都渋谷区、オンライン開催、Zoom など"
                error={errors.location}
                maxLength={200}
                helperText="具体的な住所、オンラインプラットフォーム名など"
                icon="📍"
              />

              <EnhancedFormField
                label="開催形式"
                name="venue_type"
                type="select"
                value={formData.venue_type}
                onChange={handleInputChange}
                options={[
                  { value: 'online', label: '🌐 オンライン' },
                  { value: 'offline', label: '🏢 オフライン' },
                  { value: 'hybrid', label: '🔄 ハイブリッド' }
                ]}
                placeholder="開催形式を選択してください"
                error={errors.venue_type}
                helperText="参加者がどのように参加するかを選択してください"
                icon="🎪"
              />
            </div>

            {/* URL情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedFormField
                label="公式サイトURL"
                name="site_url"
                type="url"
                value={formData.site_url}
                onChange={handleInputChange}
                onValidate={(value) => handleFieldValidation('site_url', value)}
                placeholder="https://example.com"
                error={errors.site_url}
                helperText="イベントの詳細情報やチケット購入ページなど"
                icon="🔗"
              />

              <EnhancedFormField
                label="画像URL"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleInputChange}
                onValidate={(value) => handleFieldValidation('image_url', value)}
                placeholder="https://example.com/image.jpg"
                error={errors.image_url}
                helperText="イベントのサムネイル画像（任意）"
                icon="🖼️"
              />
            </div>

            {/* タグ */}
            <EnhancedFormField
              label="タグ"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              onValidate={(value) => handleFieldValidation('tags', value)}
              placeholder="React, JavaScript, Frontend（カンマ区切り）"
              error={errors.tags}
              maxLength={250}
              helperText="複数のタグはカンマで区切って入力してください（最大10個、各タグ20文字以下）"
              icon="🏷️"
            />

            {/* 公開設定 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🔒</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">公開設定</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="is_public"
                        value="true"
                        checked={formData.is_public === true}
                        onChange={(e) => setFormData({ ...formData, is_public: true })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div>
                        <div className="font-medium text-gray-900">🌐 公開イベント</div>
                        <div className="text-sm text-gray-600">
                          誰でもイベントを閲覧できます。イベント一覧にも表示されます。
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="is_public"
                        value="false"
                        checked={formData.is_public === false}
                        onChange={(e) => setFormData({ ...formData, is_public: false })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div>
                        <div className="font-medium text-gray-900">🔒 プライベートイベント</div>
                        <div className="text-sm text-gray-600">
                          URLを知っている人のみ閲覧可能です。イベント一覧には表示されません。
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
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