import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Car } from '@/types/types';

interface CompareContextType {
  compareList: Car[];
  addToCompare: (car: Car) => boolean;
  removeFromCompare: (carId: string) => void;
  clearCompare: () => void;
  isInCompare: (carId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Car[]>([]);

  const addToCompare = (car: Car): boolean => {
    if (compareList.length >= 3) return false;
    if (compareList.find(c => c.id === car.id)) return true;
    setCompareList(prev => [...prev, car]);
    return true;
  };

  const removeFromCompare = (carId: string) => {
    setCompareList(prev => prev.filter(c => c.id !== carId));
  };

  const clearCompare = () => setCompareList([]);

  const isInCompare = (carId: string) => compareList.some(c => c.id === carId);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
}
