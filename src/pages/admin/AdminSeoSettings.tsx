import { useState, useEffect } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import type { SeoSetting } from '@/types/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const DEFAULT_PAGES = [
  { page_key: 'home', label: 'Home Page', title: '', description: '', keywords: '' },
  { page_key: 'inventory', label: 'Inventory', title: '', description: '', keywords: '' },
  { page_key: 'auctions', label: 'Auctions', title: '', description: '', keywords: '' },
  { page_key: 'blog', label: 'Blog', title: '', description: '', keywords: '' },
  { page_key: 'about', label: 'About', title: '', description: '', keywords: '' },
  { page_key: 'contact', label: 'Contact', title: '', description: '', keywords: '' },
];

export default function AdminSeoSettings() {
  const { t } = useLanguage();
  const [pages, setPages] = useState(DEFAULT_PAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('seo_settings').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setPages(prev => prev.map(p => {
          const found = (data as SeoSetting[]).find(d => d.page_key === p.page_key);
          return found ? { ...p, title: found.meta_title || '', description: found.meta_description || '', keywords: found.meta_keywords || '' } : p;
        }));
      }
      setLoading(false);
    });
  }, []);

  const setField = (pageKey: string, field: string, value: string) => {
    setPages(prev => prev.map(p => p.page_key === pageKey ? { ...p, [field]: value } : p));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const page of pages) {
        await supabase.from('seo_settings').upsert(
          { page_key: page.page_key, meta_title: page.title || null, meta_description: page.description || null, meta_keywords: page.keywords || null },
          { onConflict: 'page_key' }
        );
      }
      toast.success('SEO settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout><div className="p-6"><div className="animate-pulse bg-muted rounded h-48" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">SEO Settings</h1>
            <p className="text-sm text-muted-foreground">Manage meta titles, descriptions, and keywords per page</p>
          </div>
          <Button size="sm" onClick={saveAll} disabled={saving} className="h-9 gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save All
          </Button>
        </div>

        <Tabs defaultValue="home">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 rounded-lg">
            {pages.map(p => (
              <TabsTrigger key={p.page_key} value={p.page_key} className="text-xs h-7 px-3">{p.label}</TabsTrigger>
            ))}
          </TabsList>
          {pages.map(p => (
            <TabsContent key={p.page_key} value={p.page_key} className="pt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    {p.label} — SEO Meta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs">Meta Title</Label>
                      <span className={`text-xs ${p.title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {p.title.length}/60
                      </span>
                    </div>
                    <Input value={p.title} onChange={e => setField(p.page_key, 'title', e.target.value)} className="h-9 text-sm" placeholder="Page title for search engines..." />
                    <p className="text-xs text-muted-foreground mt-1">Recommended: 50–60 characters</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs">Meta Description</Label>
                      <span className={`text-xs ${p.description.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {p.description.length}/160
                      </span>
                    </div>
                    <Textarea value={p.description} onChange={e => setField(p.page_key, 'description', e.target.value)} className="text-sm resize-none min-h-[80px]" placeholder="Brief description for search results..." />
                    <p className="text-xs text-muted-foreground mt-1">Recommended: 120–160 characters</p>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Keywords</Label>
                    <Input value={p.keywords} onChange={e => setField(p.page_key, 'keywords', e.target.value)} className="h-9 text-sm" placeholder="car, buy car, Pakistan, automobile..." />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords</p>
                  </div>

                  {/* SERP preview */}
                  {(p.title || p.description) && (
                    <div className="p-4 border border-border rounded-lg bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-2">Search Preview</p>
                      <p className="text-blue-600 text-sm font-medium truncate">{p.title || 'Page Title'}</p>
                      <p className="text-xs text-green-700 dark:text-green-500">https://xyzautos.com/{p.page_key === 'home' ? '' : p.page_key}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description || 'Meta description will appear here...'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
