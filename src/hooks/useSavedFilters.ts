import { useState, useEffect, useCallback } from 'react';

export interface SavedFilter {
  id: string;
  name: string;
  query: string;
  filterBy: string;
  timestamp: string;
  projectId: string;
}

const STORAGE_KEY = 'cathedra_saved_filters_v1';

export function useSavedFilters(projectId: string = 'global') {
  const [filters, setFilters] = useState<SavedFilter[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const allFilters = raw ? JSON.parse(raw) : {};
      return allFilters[projectId] || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const allFilters = raw ? JSON.parse(raw) : {};
      allFilters[projectId] = filters;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allFilters));
    } catch (e) {
      console.error('Error saving filters:', e);
    }
  }, [filters, projectId]);

  const saveFilter = useCallback((name: string, query: string, filterBy: string) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      query,
      filterBy,
      timestamp: new Date().toISOString(),
      projectId
    };
    setFilters(prev => [newFilter, ...prev]);
    return newFilter;
  }, [projectId]);

  const deleteFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  const duplicateFilter = useCallback((filter: SavedFilter) => {
    const newFilter = {
      ...filter,
      id: crypto.randomUUID(),
      name: `${filter.name} (Cópia)`,
      timestamp: new Date().toISOString()
    };
    setFilters(prev => [newFilter, ...prev]);
  }, []);

  return { filters, saveFilter, deleteFilter, duplicateFilter };
}
