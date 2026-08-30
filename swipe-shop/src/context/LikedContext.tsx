import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '../types';

const STORAGE_KEY = '@swipe-shop/liked-products';

interface LikedContextValue {
  liked: Product[];
  isLiked: (id: string) => boolean;
  addLiked: (product: Product) => void;
  removeLiked: (id: string) => void;
}

const LikedContext = createContext<LikedContextValue | undefined>(undefined);

export function LikedProvider({ children }: { children: React.ReactNode }) {
  const [liked, setLiked] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setLiked(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liked)).catch(() => {});
  }, [liked, loaded]);

  const addLiked = (product: Product) => {
    setLiked((prev) => (prev.some((p) => p.id === product.id) ? prev : [product, ...prev]));
  };

  const removeLiked = (id: string) => {
    setLiked((prev) => prev.filter((p) => p.id !== id));
  };

  const isLiked = (id: string) => liked.some((p) => p.id === id);

  const value = useMemo(() => ({ liked, isLiked, addLiked, removeLiked }), [liked]);

  return <LikedContext.Provider value={value}>{children}</LikedContext.Provider>;
}

export function useLiked() {
  const ctx = useContext(LikedContext);
  if (!ctx) throw new Error('useLiked must be used within a LikedProvider');
  return ctx;
}
