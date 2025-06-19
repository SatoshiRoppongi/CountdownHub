// バリデーションエラーの型定義
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'range' | 'custom';
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  errorObjects: ValidationError[];
}

// バリデーションルールの型定義
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

// 汎用バリデーション関数
export const validateField = (
  value: any,
  rules: ValidationRule,
  fieldName: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const stringValue = String(value || '').trim();

  // 必須チェック
  if (rules.required && !stringValue) {
    errors.push({
      field: fieldName,
      message: `${fieldName}は必須です`,
      type: 'required'
    });
    return errors; // 必須エラーがある場合は他のチェックをスキップ
  }

  // 空の場合は他のチェックをスキップ
  if (!stringValue) return errors;

  // 最小長チェック
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName}は${rules.minLength}文字以上で入力してください`,
      type: 'length'
    });
  }

  // 最大長チェック
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName}は${rules.maxLength}文字以内で入力してください`,
      type: 'length'
    });
  }

  // パターンチェック
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push({
      field: fieldName,
      message: `${fieldName}の形式が正しくありません`,
      type: 'format'
    });
  }

  // 数値範囲チェック
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push({
        field: fieldName,
        message: `${fieldName}は${rules.min}以上である必要があります`,
        type: 'range'
      });
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push({
        field: fieldName,
        message: `${fieldName}は${rules.max}以下である必要があります`,
        type: 'range'
      });
    }
  }

  // カスタムバリデーション
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push({
        field: fieldName,
        message: customError,
        type: 'custom'
      });
    }
  }

  return errors;
};

// スキーマ全体をバリデーション
export const validateSchema = (
  data: Record<string, any>,
  schema: ValidationSchema
): ValidationResult => {
  const allErrors: ValidationError[] = [];
  const errorMessages: Record<string, string> = {};

  Object.entries(schema).forEach(([fieldName, rules]) => {
    const fieldErrors = validateField(data[fieldName], rules, fieldName);
    allErrors.push(...fieldErrors);
    
    if (fieldErrors.length > 0) {
      errorMessages[fieldName] = fieldErrors[0].message; // 最初のエラーを表示
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: errorMessages,
    errorObjects: allErrors
  };
};

// 日付バリデーション関数
export const validateDate = (
  dateString: string,
  options: {
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
    allowPast?: boolean;
  } = {}
): string | null => {
  if (options.required && !dateString) {
    return '日付は必須です';
  }

  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '有効な日付を入力してください';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!options.allowPast && date < today) {
    return '過去の日付は選択できません';
  }

  if (options.minDate && date < options.minDate) {
    return `${options.minDate.toLocaleDateString()}以降の日付を選択してください`;
  }

  if (options.maxDate && date > options.maxDate) {
    return `${options.maxDate.toLocaleDateString()}以前の日付を選択してください`;
  }

  return null;
};

// URL バリデーション
export const validateURL = (url: string, required: boolean = false): string | null => {
  if (required && !url.trim()) {
    return 'URLは必須です';
  }

  if (!url.trim()) return null;

  try {
    new URL(url);
    return null;
  } catch {
    return '有効なURLを入力してください（例: https://example.com）';
  }
};

// メールアドレス バリデーション
export const validateEmail = (email: string, required: boolean = false): string | null => {
  if (required && !email.trim()) {
    return 'メールアドレスは必須です';
  }

  if (!email.trim()) return null;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return '有効なメールアドレスを入力してください';
  }

  return null;
};

// パスワード バリデーション
export const validatePassword = (
  password: string,
  options: {
    required?: boolean;
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): string | null => {
  const {
    required = true,
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false
  } = options;

  if (required && !password) {
    return 'パスワードは必須です';
  }

  if (!password) return null;

  if (password.length < minLength) {
    return `パスワードは${minLength}文字以上である必要があります`;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return 'パスワードに大文字を含める必要があります';
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return 'パスワードに小文字を含める必要があります';
  }

  if (requireNumbers && !/\d/.test(password)) {
    return 'パスワードに数字を含める必要があります';
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'パスワードに特殊文字を含める必要があります';
  }

  return null;
};

// タグ バリデーション
export const validateTags = (tagsString: string): string | null => {
  if (!tagsString.trim()) return null;

  const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  
  if (tags.length > 10) {
    return 'タグは10個以下にしてください';
  }

  const invalidTags = tags.filter(tag => tag.length > 20);
  if (invalidTags.length > 0) {
    return 'タグは1つあたり20文字以下にしてください';
  }

  return null;
};