import { 
  ValidationSchema, 
  validateDate, 
  validateURL, 
  validateTags,
  validateSchema 
} from './validation';

// イベントフォームデータの型
export interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  venue_type: string;
  site_url: string;
  image_url: string;
  tags: string;
}

// イベントバリデーションスキーマ
export const eventValidationSchema: ValidationSchema = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    custom: (value: string) => {
      const trimmed = value?.trim() || '';
      if (trimmed && trimmed.length < 3) {
        return 'タイトルは3文字以上で入力してください';
      }
      if (trimmed && trimmed.length > 100) {
        return 'タイトルは100文字以内で入力してください';
      }
      return null;
    }
  },
  description: {
    maxLength: 2000,
    custom: (value: string) => {
      const trimmed = value?.trim() || '';
      if (trimmed && trimmed.length > 2000) {
        return '説明は2000文字以内で入力してください';
      }
      return null;
    }
  },
  start_date: {
    required: true,
    custom: (value: string) => {
      return validateDate(value, { 
        required: true, 
        allowPast: false 
      });
    }
  },
  location: {
    maxLength: 200,
    custom: (value: string) => {
      const trimmed = value?.trim() || '';
      if (trimmed && trimmed.length > 200) {
        return '開催場所は200文字以内で入力してください';
      }
      return null;
    }
  },
  site_url: {
    custom: (value: string) => {
      return validateURL(value, false);
    }
  },
  image_url: {
    custom: (value: string) => {
      return validateURL(value, false);
    }
  },
  tags: {
    custom: (value: string) => {
      return validateTags(value);
    }
  }
};

// 追加のイベント固有バリデーション
export const validateEventDates = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  if (!startDate) {
    errors.start_date = '開始日は必須です';
    return errors;
  }

  // 開始日時の組み合わせ
  const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
  const now = new Date();

  if (isNaN(startDateTime.getTime())) {
    errors.start_date = '有効な開始日時を入力してください';
    return errors;
  }

  // 過去の日時チェック（編集時は緩い制限）
  if (startDateTime < now) {
    const timeDiff = now.getTime() - startDateTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // 1時間以上過去の場合はエラー
    if (hoursDiff > 1) {
      errors.start_date = '開始日時は現在時刻より後に設定してください';
    }
  }

  // 終了日時が設定されている場合のチェック
  if (endDate) {
    const endDateTime = new Date(`${endDate}T${endTime || '23:59'}`);
    
    if (isNaN(endDateTime.getTime())) {
      errors.end_date = '有効な終了日時を入力してください';
    } else if (endDateTime <= startDateTime) {
      errors.end_date = '終了日時は開始日時より後に設定してください';
    } else {
      // 開催期間が長すぎる場合の警告（30日以上）
      const durationDays = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24);
      if (durationDays > 30) {
        errors.end_date = 'イベント期間は30日以内に設定することをお勧めします';
      }
    }
  }

  return errors;
};

// 会場タイプと場所の整合性チェック
export const validateVenueConsistency = (
  venueType: string,
  location: string
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  if (venueType === 'online') {
    // オンラインイベントで物理的な住所が入力されている場合の警告
    if (location && /\d+.*\d+/.test(location)) {
      errors.location = 'オンラインイベントの場合、物理的な住所ではなくプラットフォーム名（例：Zoom、Google Meet）を入力してください';
    }
  } else if (venueType === 'offline') {
    // オフラインイベントで場所が未入力の場合
    if (!location?.trim()) {
      errors.location = 'オフラインイベントの場合、開催場所の入力をお勧めします';
    }
  }

  return errors;
};

// 完全なイベントバリデーション
export const validateEventForm = (formData: EventFormData) => {
  // 基本バリデーション
  const basicValidation = validateSchema(formData, eventValidationSchema);
  
  // 日付バリデーション
  const dateErrors = validateEventDates(
    formData.start_date,
    formData.start_time,
    formData.end_date,
    formData.end_time
  );
  
  // 会場整合性チェック
  const venueErrors = validateVenueConsistency(
    formData.venue_type,
    formData.location
  );

  // エラーをマージ
  const allErrors = {
    ...basicValidation.errors,
    ...dateErrors,
    ...venueErrors
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    errorObjects: basicValidation.errorObjects
  };
};

// リアルタイムバリデーション（入力中）
export const validateFieldRealtime = (
  fieldName: keyof EventFormData,
  value: string,
  allFormData: EventFormData
): string | null => {
  switch (fieldName) {
    case 'title':
      if (value.trim().length > 0 && value.trim().length < 3) {
        return 'タイトルは3文字以上で入力してください';
      }
      if (value.length > 100) {
        return 'タイトルは100文字以内で入力してください';
      }
      return null;

    case 'description':
      if (value.length > 2000) {
        return '説明は2000文字以内で入力してください';
      }
      return null;

    case 'location':
      if (value.length > 200) {
        return '開催場所は200文字以内で入力してください';
      }
      return null;

    case 'site_url':
      return validateURL(value, false);

    case 'image_url':
      return validateURL(value, false);

    case 'tags':
      return validateTags(value);

    case 'start_date':
      if (value) {
        const dateError = validateDate(value, { allowPast: false });
        if (dateError) return dateError;
        
        // 終了日との整合性もチェック
        if (allFormData.end_date) {
          const startDate = new Date(value);
          const endDate = new Date(allFormData.end_date);
          if (startDate > endDate) {
            return '開始日は終了日より前に設定してください';
          }
        }
      }
      return null;

    case 'end_date':
      if (value && allFormData.start_date) {
        const startDate = new Date(allFormData.start_date);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          return '終了日は開始日より後に設定してください';
        }
      }
      return null;

    default:
      return null;
  }
};