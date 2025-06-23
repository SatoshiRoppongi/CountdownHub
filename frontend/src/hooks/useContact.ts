import { useMutation } from '@tanstack/react-query';

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

const submitContact = async (data: ContactFormData): Promise<ContactResponse> => {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'お問い合わせの送信に失敗しました');
  }

  return response.json();
};

export const useContact = () => {
  return useMutation({
    mutationFn: submitContact,
    onError: (error) => {
      console.error('Contact submission error:', error);
    },
  });
};