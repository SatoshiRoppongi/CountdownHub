import { useMutation } from '@tanstack/react-query';
import { contactAPI } from '../services/api';
import { AxiosError } from 'axios';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

interface ContactResponse {
  message: string;
  contact: {
    id: number;
    created_at: string;
  };
}

interface ValidationError {
  field: string;
  message: string;
}

interface ErrorResponse {
  message: string;
  errors?: ValidationError[];
}

const submitContact = async (data: ContactFormData): Promise<ContactResponse> => {
  try {
    return await contactAPI.submitContact(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = error.response?.data as ErrorResponse;
      
      if (error.response?.status === 400 && errorData?.errors) {
        // バリデーションエラーの場合、詳細なメッセージを作成
        const validationMessages = errorData.errors.map(err => err.message).join('\n');
        throw new Error(`入力内容を確認してください:\n\n${validationMessages}`);
      } else if (errorData?.message) {
        throw new Error(errorData.message);
      }
    }
    
    throw new Error('お問い合わせの送信に失敗しました。時間をおいて再度お試しください。');
  }
};

export const useContact = () => {
  return useMutation({
    mutationFn: submitContact,
    onError: (error) => {
      console.error('Contact submission error:', error);
    },
  });
};