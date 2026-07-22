/**
 * useCarDatabase — fast in-memory cache for brands/models/variants
 * Single fetch on mount, cached for the session lifetime.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import type { CarBrand, CarModel, CarVariant } from '@/types/types';

interface CarDB {
  brands: CarBrand[];
  models: CarModel[];
  variants: CarVariant[];
  loading: boolean;
  modelsForBrand: (brandId: string) => CarModel[];
  variantsForModel: (modelId: string) => CarVariant[];
  getBrandName: (id: string) => string | undefined;
  getModelName: (id: string) => string | undefined;
  getVariantName: (id: string) => string | undefined;
}

// Module-level cache so it survives re-renders / multiple hook instances
let _brands: CarBrand[] = [];
let _models: CarModel[] = [];
let _variants: CarVariant[] = [];
let _loaded = false;
let _loading = false;
const _listeners: Array<() => void> = [];

async function fetchAll() {
  if (_loaded || _loading) return;
  _loading = true;
  const [b, m, v] = await Promise.all([
    supabase.from('car_brands').select('*').eq('is_active', true).order('name'),
    supabase.from('car_models').select('*').eq('is_active', true).order('name'),
    supabase.from('car_variants').select('*').eq('is_active', true).order('name'),
  ]);
  _brands   = (b.data as CarBrand[])   || [];
  _models   = (m.data as CarModel[])   || [];
  _variants = (v.data as CarVariant[]) || [];
  _loaded  = true;
  _loading = false;
  _listeners.forEach(fn => fn());
}

export function useCarDatabase(): CarDB {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick(t => t + 1);
    _listeners.push(refresh);
    if (!_loaded) fetchAll();
    else refresh();
    return () => {
      const idx = _listeners.indexOf(refresh);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }, []);

  return {
    brands:  _brands,
    models:  _models,
    variants: _variants,
    loading: !_loaded,
    modelsForBrand:  (bId) => _models.filter(m => m.brand_id === bId),
    variantsForModel:(mId) => _variants.filter(v => v.model_id === mId),
    getBrandName: (id) => _brands.find(b => b.id === id)?.name,
    getModelName: (id) => _models.find(m => m.id === id)?.name,
    getVariantName: (id) => _variants.find(v => v.id === id)?.name,
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}

/** Invalidate cache so AdminVehicleDatabase changes reflect immediately */
export function invalidateCarDatabaseCache() {
  _loaded = false;
  _brands = []; _models = []; _variants = [];
}
