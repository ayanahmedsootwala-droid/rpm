import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { Auction, AuctionFilters } from '@/types/types';

export function useAuctions(filters: AuctionFilters = {}, limit = 12) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('auctions').select('*, car:cars(id,title,brand_name,model_name,year,images,registration_city)', { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.minPrice) query = query.gte('current_bid', filters.minPrice);
    if (filters.maxPrice) query = query.lte('current_bid', filters.maxPrice);

    const sortMap: Record<string, { col: string; asc: boolean }> = {
      ending_soon: { col: 'end_time', asc: true },
      newest: { col: 'created_at', asc: false },
      bid_asc: { col: 'current_bid', asc: true },
      bid_desc: { col: 'current_bid', asc: false },
    };
    const sort = sortMap[filters.sortBy || 'ending_soon'] || sortMap.ending_soon;
    query = query.order(sort.col, { ascending: sort.asc }).limit(limit);

    const { data, error } = await query;
    if (!error) setAuctions((data as Auction[]) || []);
    setLoading(false);
  }, [JSON.stringify(filters), limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { auctions, loading, refetch: fetch };
}

export function useAuction(id: string) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('auctions')
      .select('*, car:cars(*), winning_bidder:profiles(id,full_name,avatar_url)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => { setAuction(data as Auction | null); setLoading(false); });
  }, [id]);

  return { auction, setAuction, loading };
}
