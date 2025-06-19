import React, { useState, useEffect } from 'react';

interface EnhancedFormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'textarea' | 'url' | 'date' | 'time' | 'select';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onValidate?: (value: string) => string | null;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  maxLength?: number;
  rows?: number;
  icon?: React.ReactNode;
  className?: string;
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onValidate,
  options,
  placeholder,
  required = false,
  error,
  helperText,
  maxLength,
  rows = 3,
  icon,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [showCharCount, setShowCharCount] = useState(false);

  // リアルタイムバリデーション
  useEffect(() => {
    if (isFocused && onValidate && value) {
      const validationError = onValidate(value);
      setRealtimeError(validationError);
    } else {
      setRealtimeError(null);
    }
  }, [value, onValidate, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    if (maxLength) {
      setShowCharCount(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setShowCharCount(false);
  };

  const displayError = error || realtimeError;
  const hasError = !!displayError;
  const isValid = !hasError && value.trim().length > 0;

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${hasError 
      ? 'border-red-500 bg-red-50' 
      : isValid 
        ? 'border-green-500 bg-green-50' 
        : 'border-gray-300 bg-white'
    }
    ${isFocused ? 'ring-2 ring-blue-200' : ''}
  `;

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value,
      onChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder,
      maxLength,
      className: baseInputClasses,
      'aria-invalid': hasError,
      'aria-describedby': `${name}-helper ${name}-error`
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            style={{ resize: 'vertical', minHeight: `${rows * 1.5}rem` }}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{placeholder || '選択してください'}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return <input {...commonProps} type={type} />;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ラベル */}
      <label 
        htmlFor={name} 
        className={`
          block text-sm font-medium transition-colors duration-200
          ${hasError ? 'text-red-700' : isValid ? 'text-green-700' : 'text-gray-700'}
        `}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
      </label>

      {/* 入力フィールド */}
      <div className="relative">
        {renderInput()}
        
        {/* バリデーション状態アイコン */}
        {(isValid || hasError) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <span className="text-green-500">✓</span>
            ) : hasError ? (
              <span className="text-red-500">✕</span>
            ) : null}
          </div>
        )}
      </div>

      {/* 文字数カウンター */}
      {showCharCount && maxLength && (
        <div className="flex justify-end">
          <span 
            className={`text-xs ${
              value.length > maxLength * 0.9 
                ? 'text-red-500' 
                : value.length > maxLength * 0.7 
                  ? 'text-yellow-500' 
                  : 'text-gray-500'
            }`}
          >
            {value.length} / {maxLength}
          </span>
        </div>
      )}

      {/* エラーメッセージ */}
      {displayError && (
        <div 
          id={`${name}-error`}
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
          role="alert"
        >
          <span className="text-red-500">⚠️</span>
          {displayError}
        </div>
      )}

      {/* ヘルパーテキスト */}
      {helperText && !displayError && (
        <div 
          id={`${name}-helper`}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <span className="text-blue-500">💡</span>
          {helperText}
        </div>
      )}
    </div>
  );
};