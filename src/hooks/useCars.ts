import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { Car, CarFilters } from '@/types/types';

const DEFAULT_PAGE_SIZE = 12;

export function useCars(filters: CarFilters = {}, page = 1) {
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('cars').select('*', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.in('status', ['active', 'sold', 'reserved']);
    }

    // Support both camelCase and snake_case filter keys
    const make = filters.make;
    const model = filters.model;
    const minPrice = filters.minPrice ?? filters.price_min;
    const maxPrice = filters.maxPrice ?? filters.price_max;
    const minYear = filters.minYear ?? filters.year_min;
    const maxYear = filters.maxYear ?? filters.year_max;
    const city = filters.city;
    const condition = filters.condition;
    const fuelType = filters.fuelType ?? filters.fuel_type;
    const transmission = filters.transmission;
    const bodyType = filters.bodyType ?? filters.body_type;
    const color = filters.color;
    const brandId = filters.brand_id;

    if (make) query = query.ilike('brand_name', `%${make}%`);
    if (model) query = query.ilike('model_name', `%${model}%`);
    if (brandId) query = query.eq('brand_id', brandId);
    if (filters.model_id) query = query.eq('model_id', filters.model_id);
    if (filters.variant_id) query = query.eq('variant_id', filters.variant_id);
    if (minPrice) query = query.gte('price', minPrice);
    if (maxPrice) query = query.lte('price', maxPrice);
    if (minYear) query = query.gte('year', minYear);
    if (maxYear) query = query.lte('year', maxYear);
    if (city) query = query.or(`city.ilike.%${city}%,registration_city.ilike.%${city}%`);
    if (condition) query = query.eq('condition', condition);
    if (fuelType) query = query.eq('fuel_type', fuelType);
    if (transmission) query = query.eq('transmission', transmission);
    if (bodyType) query = query.eq('body_type', bodyType);
    if (color) query = query.eq('color', color);
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,brand_name.ilike.%${filters.search}%,model_name.ilike.%${filters.search}%`
      );
    }

    const sortMap: Record<string, { col: string; asc: boolean }> = {
      latest: { col: 'created_at', asc: false },
      price_asc: { col: 'price', asc: true },
      price_desc: { col: 'price', asc: false },
      views: { col: 'views', asc: false },
    };
    const sort = sortMap[filters.sortBy || 'latest'] || sortMap.latest;
    query = query.order(sort.col, { ascending: sort.asc });

    // Support offset directly in filters or via page argument
    const pageSize = filters.limit ?? DEFAULT_PAGE_SIZE;
    const from = filters.offset ?? (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('[useCars] query error:', error.message, error.details, error.hint);
    } else {
      setCars((data as Car[]) || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [JSON.stringify(filters), page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { cars, total, loading, pageSize: DEFAULT_PAGE_SIZE, refetch: fetch };
}

export function useCar(id: string) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('cars').select('*, dealership:dealerships(*), seller:profiles(id,full_name,avatar_url,email,phone)').eq('id', id).maybeSingle()
      .then(({ data }) => { setCar(data as Car | null); setLoading(false); });
    // Increment view count
    supabase.rpc('increment_car_views', { car_id: id }).then(() => {});
  }, [id]);

  return { car, loading };
}
