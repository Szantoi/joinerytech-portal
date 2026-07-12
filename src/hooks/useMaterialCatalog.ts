import { useState, useEffect } from 'react';
import type { Material } from '../types/quote';

export function useMaterialCatalog() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/abstractions/api/modules/materials?category=Panel');
        if (response.ok) {
          const data = await response.json();
          setMaterials(data);
        } else {
          throw new Error('Failed to fetch materials');
        }
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        // Mock fallback for development
        setMaterials([
          { code: 'PAL-18-WHITE', name: 'PAL Fehér', thickness: 18, category: 'Panel' },
          { code: 'PAL-18-OAK', name: 'PAL Tölgy', thickness: 18, category: 'Panel' },
          { code: 'PAL-18-BEECH', name: 'PAL Bükk', thickness: 18, category: 'Panel' },
          { code: 'PAL-25-WHITE', name: 'PAL Fehér', thickness: 25, category: 'Panel' },
          { code: 'MDF-18-WHITE', name: 'MDF Fehér', thickness: 18, category: 'Panel' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  return { materials, loading, error };
}
