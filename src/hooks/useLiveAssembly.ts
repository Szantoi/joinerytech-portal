import { useQuery } from '@tanstack/react-query';

export interface AssemblyTimelineData {
  events: Array<{
    id: string;
    type: 'plan' | 'actual';
    step: string;
    material: string;
    status: 'ok' | 'delay' | 'ahead';
    deltaMinutes?: number;
    timestamp: string;
  }>;
  lastUpdate: string;
}

export const useLiveAssembly = (assemblyId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['assembly', assemblyId, 'timeline'],
    queryFn: async () => {
      const response = await fetch(
        `/api/assembly/${assemblyId}/timeline?merged=true`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch assembly timeline');
      }
      return response.json() as Promise<AssemblyTimelineData>;
    },
    refetchInterval: 30000, // 30s polling
    staleTime: 25000, // Consider data stale after 25s
  });

  return {
    timelineData: data,
    isLoading,
    error,
    isLive: true,
    lastUpdate: data?.lastUpdate ? new Date(data.lastUpdate) : new Date(),
  };
};
