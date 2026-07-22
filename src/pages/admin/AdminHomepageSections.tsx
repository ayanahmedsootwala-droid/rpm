import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import type { HomepageSection } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminHomepageSections() {
  const { t } = useLanguage();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('homepage_sections').select('*').order('display_order').then(({ data }) => {
      setSections((data as HomepageSection[]) || []);
      setLoading(false);
    });
  }, []);

  const move = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx], newSections[index]];
    setSections(newSections.map((s, i) => ({ ...s, display_order: i + 1 })));
  };

  const toggleVisible = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  };

  const setTitle = (id: string, title: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        await supabase.from('homepage_sections').update({
          title: section.title, is_active: section.is_active, display_order: section.display_order
        }).eq('id', section.id);
      }
      toast.success('Section layout saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const SECTION_LABELS: Record<string, string> = {
    hero: 'Hero Banner',
    featured_cars: 'Featured Cars',
    auctions: 'Live Auctions',
    brands: 'Brand Carousel',
    testimonials: 'Testimonials',
    blog: 'Latest Blog Posts',
    cta: 'Call to Action',
    stats: 'Platform Stats',
    dealerships: 'Top Dealerships',
    why_us: 'Why Choose Us',
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Homepage Sections</h1>
            <p className="text-sm text-muted-foreground">Control visibility and ordering of homepage sections</p>
          </div>
          <Button size="sm" onClick={saveAll} disabled={saving} className="h-9 gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Layout
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-xl">
            <p className="text-muted-foreground text-sm">No sections configured. Check your database.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section, i) => (
              <Card key={section.id} className={cn('transition-opacity', !section.is_active && 'opacity-50')}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => move(i, 'up')} disabled={i === 0} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▲</button>
                    <button onClick={() => move(i, 'down')} disabled={i === sections.length - 1} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▼</button>
                  </div>
                  <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{SECTION_LABELS[section.section_key] || section.section_key}</p>
                    <p className="text-xs text-muted-foreground font-mono">{section.section_key}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={section.is_active ? 'default' : 'secondary'} className="text-xs h-5">
                      {section.is_active ? 'Visible' : 'Hidden'}
                    </Badge>
                    <Switch checked={section.is_active || false} onCheckedChange={() => toggleVisible(section.id)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">Drag the arrows to reorder. Toggle the switch to show/hide a section. Click "Save Layout" to persist changes.</p>
      </div>
    </AdminLayout>
  );
}
