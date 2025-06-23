import { useMutation } from '@tanstack/react-query';
import { contactAPI } from '../services/api';

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
  return contactAPI.submitContact(data);
};

export const useContact = () => {
  return useMutation({
    mutationFn: submitContact,
    onError: (error) => {
      console.error('Contact submission error:', error);
    },
  });
};