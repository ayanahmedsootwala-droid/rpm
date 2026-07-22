import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { SiteSetting } from '@/types/types';

type SettingsMap = Record<string, string>;

interface SiteSettingsContextType {
  settings: SettingsMap;
  loading: boolean;
  updateSetting: (key: string, value: string) => Promise<{ error: unknown }>;
  getSetting: (key: string, defaultVal?: string) => string;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('key, value');
    if (data) {
      const map: SettingsMap = {};
      (data as SiteSetting[]).forEach(s => { if (s.value !== null) map[s.key] = s.value; });
      setSettings(map);
      
      if (map['theme_css']) {
        let styleEl = document.getElementById('custom-theme-css');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'custom-theme-css';
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = map['theme_css'];
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();

    // Realtime: re-sync whenever any setting row changes in the DB
    const channelName = `site_settings_changes_${Math.random().toString(36).substring(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          // Merge the changed row into shared state immediately
          const row = (payload.new || payload.old) as SiteSetting | undefined;
          if (row?.key) {
            setSettings(prev => {
              if (payload.eventType === 'DELETE') {
                const next = { ...prev };
                delete next[row.key];
                return next;
              }
              if (row.value !== null && row.value !== undefined) {
                return { ...prev, [row.key]: row.value };
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: string) => {
    // Safety check: ensure we have an authenticated session before writing.
    // Without this, upserts on admin-protected tables return 401 if called
    // before getSession() resolves on the first render.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.warn('[SiteSettings] updateSetting called without an active session — skipping');
      return { error: new Error('Not authenticated') };
    }
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' });
    if (!error) {
      // Optimistically update shared state so all consumers see it immediately
      setSettings(prev => ({ ...prev, [key]: value }));
    }
    return { error };
  };

  const getSetting = useCallback(
    (key: string, defaultVal = '') => settings[key] || defaultVal,
    [settings]
  );

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, updateSetting, getSetting, refresh: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettingsContext() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettingsContext must be used inside SiteSettingsProvider');
  return ctx;
}
