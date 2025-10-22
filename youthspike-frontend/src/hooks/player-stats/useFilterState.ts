// hooks/useFilterState.ts
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { IFilter } from '@/types';



export function useFilterState(initialFilter: Partial<IFilter> = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<Partial<IFilter>>(() => {
    // Initialize from URL params
    const params: Partial<IFilter> = {};
    
    if (searchParams.get('startDate')) params.startDate = searchParams.get('startDate')!;
    if (searchParams.get('endDate')) params.endDate = searchParams.get('endDate')!;
    if (searchParams.get('conference')) params.conference = searchParams.get('conference')!;
    
    // Handle array params
    if (searchParams.get('match')) params.match = searchParams.getAll('match');
    if (searchParams.get('game')) params.game = searchParams.getAll('game');
    if (searchParams.get('teammate')) params.teammate = searchParams.getAll('teammate');
    if (searchParams.get('club')) params.club = searchParams.getAll('club');
    if (searchParams.get('vsPlayer')) params.vsPlayer = searchParams.getAll('vsPlayer');
    
    return { ...initialFilter, ...params };
  });

  // Update URL when filter changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    });

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [filter, router]);

  const updateFilter = (updates: Partial<IFilter>) => {
    setFilter(prev => {
      const newFilter = { ...prev, ...updates };
      
      // Reset dependent filters
      if (updates.match && !arraysEqual(prev.match, updates.match)) {
        newFilter.game = [];
      }
      
      return newFilter;
    });
  };

  const handleInputChange = (name: string, value: string | string[]) => {
    updateFilter({ [name]: value });
  };

  return {
    filter,
    updateFilter,
    handleInputChange
  };
}

// Helper function to compare arrays
function arraysEqual(a?: string[], b?: string[]): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}