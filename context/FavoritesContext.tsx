import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  isFavorite as isFav,
  loadFavorites,
  saveFavorites,
  toggleFavorite as toggle,
  type FavoriteItem,
} from '@/lib/favorites';

interface FavoritesValue {
  favorites: FavoriteItem[];
  ready: boolean;
  isFavorite: (id: string) => boolean;
  toggle: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  remove: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadFavorites().then((list) => {
      setFavorites(list);
      setReady(true);
      loaded.current = true;
    });
  }, []);

  // Persiste à chaque changement (après le chargement initial).
  useEffect(() => {
    if (loaded.current) saveFavorites(favorites);
  }, [favorites]);

  const isFavorite = useCallback((id: string) => isFav(favorites, id), [favorites]);

  const toggleItem = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => toggle(prev, item, Date.now()));
  }, []);

  const remove = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, ready, isFavorite, toggle: toggleItem, remove }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites doit être utilisé dans un FavoritesProvider');
  return ctx;
}
