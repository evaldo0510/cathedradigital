import { useState, useEffect, useCallback } from 'react';

export interface FavoriteItem {
  id: string;
  type: string;
  title: string;
  content: string;
  timestamp: string;
}

const STORAGE_KEY = 'cathedra_favorites_v2';

function loadFavorites(projectId?: string): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const allFavorites = raw ? JSON.parse(raw) : {};
    return projectId ? (allFavorites[projectId] || []) : Object.values(allFavorites).flat() as FavoriteItem[];
  } catch { return []; }
}

function saveFavorites(favorites: FavoriteItem[], projectId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const allFavorites = raw ? JSON.parse(raw) : {};
    allFavorites[projectId] = favorites;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allFavorites));
  } catch (e) { console.error('Error saving favorites:', e); }
}

export function useFavorites(projectId: string = 'global') {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => loadFavorites(projectId));

  useEffect(() => {
    setFavorites(loadFavorites(projectId));
  }, [projectId]);

  useEffect(() => {
    saveFavorites(favorites, projectId);
  }, [favorites, projectId]);

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'id' | 'timestamp'>) => {
    setFavorites(prev => {
      if (prev.some(f => f.type === item.type && f.title === item.title)) return prev;
      return [{ ...item, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  }, []);

  const isFavorite = useCallback((type: string, title: string) => {
    return favorites.some(f => f.type === type && f.title === title);
  }, [favorites]);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'id' | 'timestamp'>) => {
    const existing = favorites.find(f => f.type === item.type && f.title === item.title);
    if (existing) removeFavorite(existing.id);
    else addFavorite(item);
  }, [favorites, addFavorite, removeFavorite]);

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
