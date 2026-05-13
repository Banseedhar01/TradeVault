import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradesApi } from '../api/trades';
import { Trade } from '../types/trade';
import toast from 'react-hot-toast';

export const useTrades = () => {
  return useQuery({
    queryKey: ['trades'],
    queryFn: tradesApi.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tradesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['equity-curve'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      toast.success('Trade created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create trade: ${error.message}`);
    },
  });
};

export const useUpdateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Trade> }) =>
      tradesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['equity-curve'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      toast.success('Trade updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update trade: ${error.message}`);
    },
  });
};

export const useDeleteTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tradesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['equity-curve'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      toast.success('Trade deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete trade: ${error.message}`);
    },
  });
};