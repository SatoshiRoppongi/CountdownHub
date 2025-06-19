import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { AdminStats } from '../types';

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminAPI.getStats(),
  });
};

export const useImportEventsFromCSV = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => adminAPI.importEventsFromCSV(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};