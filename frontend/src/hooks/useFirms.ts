import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firmsApi } from '../api/firms';
import { PropFirm } from '../types/firm';
import toast from 'react-hot-toast';

export const useFirms = () => {
  return useQuery({
    queryKey: ['firms'],
    queryFn: firmsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateFirm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: firmsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firms'] });
      toast.success('Prop firm created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create firm: ${error.message}`);
    },
  });
};

export const useUpdateFirm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PropFirm> }) =>
      firmsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firms'] });
      toast.success('Prop firm updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update firm: ${error.message}`);
    },
  });
};

export const useDeleteFirm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: firmsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firms'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Prop firm deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete firm: ${error.message}`);
    },
  });
};