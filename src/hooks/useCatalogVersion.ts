import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export interface CatalogVersion {
  id: string;
  version: string;
  timestamp: string;
  author?: string;
  keyChanges?: string[];
  data: Record<string, unknown>;
}

export interface CatalogTimeline {
  catalogId: string;
  snapshots: Array<{
    id: string;
    version: string;
    timestamp: string;
    keyChanges?: string[];
  }>;
}

export const useCatalogVersion = (catalogId: string) => {
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);

  // Fetch timeline (list of all versions)
  const { data: timeline, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['catalog', catalogId, 'timeline'],
    queryFn: async () => {
      const response = await fetch(`/api/catalog/${catalogId}/timeline`);
      if (!response.ok) {
        throw new Error('Failed to fetch catalog timeline');
      }
      return response.json() as Promise<CatalogTimeline>;
    },
  });

  const selectedSnapshot = timeline?.snapshots[selectedVersionIndex];

  // Fetch specific version data
  const { data: versionData, isLoading: isLoadingVersion } = useQuery({
    queryKey: ['catalog', catalogId, 'version', selectedSnapshot?.id],
    queryFn: async () => {
      if (!selectedSnapshot) return null;
      const response = await fetch(
        `/api/catalog/${catalogId}/version/${selectedSnapshot.id}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch version data');
      }
      return response.json() as Promise<CatalogVersion>;
    },
    enabled: !!selectedSnapshot,
  });

  const handleVersionChange = (index: number) => {
    setSelectedVersionIndex(index);
  };

  const handleRestore = async () => {
    if (!versionData) return;

    const response = await fetch(`/api/catalog/${catalogId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionId: versionData.id,
        createDraft: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to restore version');
    }

    return response.json();
  };

  return {
    timeline,
    snapshots: timeline?.snapshots || [],
    selectedVersionIndex,
    selectedVersion: versionData,
    isLoading: isLoadingTimeline || isLoadingVersion,
    onVersionChange: handleVersionChange,
    onRestore: handleRestore,
  };
};
