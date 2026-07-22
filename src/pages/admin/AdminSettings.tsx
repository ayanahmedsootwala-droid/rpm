import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Upload, Bot, Palette, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminSettings() {
  const { t } = useLanguage();
  const { settings, updateSetting, loading } = useSiteSettings();
  const [local, setLocal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setLocal({ ...settings });
    }
  }, [settings]);

  const set = (key: string, value: string) => setLocal(prev => ({ ...prev, [key]: value }));

  const saveAll = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(local)) {
      await updateSetting(key, value);
    }
    setSaving(false);
    toast.success('Settings saved');
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `site/logo_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed'); return; }
    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(path);
    set('site_logo_url', publicUrl);
    toast.success('Logo uploaded');
  };

  const uploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `site/hero_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed: ' + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(path);
    set('hero_image_url', publicUrl);
    toast.success('Hero image uploaded');
  };

  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'general';

  if (loading) return <AdminLayout><div className="animate-pulse bg-muted rounded h-64" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Site Settings</h1>
          <Button size="sm" className="h-9 gap-1.5" onClick={saveAll} disabled={saving}>
            <Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex-wrap h-auto bg-secondary/50">
            <TabsTrigger value="general" className="text-sm">General</TabsTrigger>
            <TabsTrigger value="hero" className="text-sm">Hero Design</TabsTrigger>
            <TabsTrigger value="ai" className="text-sm gap-1.5"><Bot className="w-3.5 h-3.5" />AI Features</TabsTrigger>
            <TabsTrigger value="social" className="text-sm">Social</TabsTrigger>
            <TabsTrigger value="contact" className="text-sm">Contact</TabsTrigger>
            <TabsTrigger value="wallet" className="text-sm">Wallet</TabsTrigger>
            <TabsTrigger value="features" className="text-sm gap-1.5"><LayoutGrid className="w-3.5 h-3.5" />Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Site Name</Label>
              <Input value={local['site_name'] || ''} onChange={e => set('site_name', e.target.value)} className="h-9 text-sm" placeholder="XYZ Automobiles" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Site Tagline</Label>
              <Input value={local['site_tagline'] || ''} onChange={e => set('site_tagline', e.target.value)} className="h-9 text-sm" placeholder="Pakistan's #1 Auto Marketplace" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Logo URL</Label>
              <div className="flex gap-2">
                <Input value={local['site_logo_url'] || ''} onChange={e => set('site_logo_url', e.target.value)} className="h-9 text-sm" placeholder="https://..." />
                <label className="h-9 px-3 border border-border rounded-md flex items-center gap-2 cursor-pointer hover:bg-secondary text-sm shrink-0">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Footer Description</Label>
              <Textarea value={local['footer_description'] || ''} onChange={e => set('footer_description', e.target.value)} className="text-sm min-h-[80px]" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Maintenance Mode</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="maintenance"
                  checked={local['maintenance_mode'] === 'true'}
                  onCheckedChange={v => set('maintenance_mode', v ? 'true' : 'false')}
                />
                <Label htmlFor="maintenance" className="text-sm font-normal cursor-pointer">Enable maintenance mode</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hero" className="space-y-5 mt-4">
            <p className="text-xs text-muted-foreground">Customise the homepage hero section appearance.</p>

            {/* Text content */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Hero Title</Label>
              <Input value={local['hero_title'] || ''} onChange={e => set('hero_title', e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Hero Subtitle</Label>
              <Textarea value={local['hero_subtitle'] || ''} onChange={e => set('hero_subtitle', e.target.value)} className="text-sm min-h-[70px]" />
            </div>

            {/* Gradient preset */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1.5"><Palette className="w-3 h-3" />Background Gradient Preset</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { key: 'midnight', label: 'Midnight', from: '#1a1f3a', to: '#0d0a1a' },
                  { key: 'navy',     label: 'Navy',     from: '#0a1628', to: '#050e2a' },
                  { key: 'obsidian', label: 'Obsidian', from: '#1a1008', to: '#0d0d0d' },
                  { key: 'emerald',  label: 'Emerald',  from: '#051a10', to: '#080f0a' },
                  { key: 'crimson',  label: 'Crimson',  from: '#1a0810', to: '#0d0609' },
                ].map(p => (
                  <button key={p.key} onClick={() => set('hero_gradient_preset', p.key)}
                    className={`rounded-lg overflow-hidden border-2 transition-all ${local['hero_gradient_preset'] === p.key || (!local['hero_gradient_preset'] && p.key === 'midnight') ? 'border-primary scale-[1.03]' : 'border-border/50 hover:border-border'}`}>
                    <div className="h-10 w-full" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
                    <p className="text-[10px] text-center py-1 text-muted-foreground">{p.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay + image */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Overlay Darkness: {parseFloat(local['hero_overlay_opacity'] || '0.55').toFixed(2)}</Label>
                <input type="range" min="0" max="0.9" step="0.05"
                  value={parseFloat(local['hero_overlay_opacity'] || '0.55')}
                  onChange={e => set('hero_overlay_opacity', e.target.value)}
                  className="w-full accent-primary" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Image Blend Opacity: {parseFloat(local['hero_image_opacity'] || '0.14').toFixed(2)}</Label>
                <input type="range" min="0" max="0.6" step="0.02"
                  value={parseFloat(local['hero_image_opacity'] || '0.14')}
                  onChange={e => set('hero_image_opacity', e.target.value)}
                  className="w-full accent-primary" />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5 block"><ImageIcon className="w-3 h-3" />Hero Backdrop Image</Label>
              <div className="flex gap-2">
                <Input value={local['hero_image_url'] || ''} onChange={e => set('hero_image_url', e.target.value)} className="h-9 text-sm" placeholder="Paste URL or upload…" />
                <label className="h-9 px-3 border border-border rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-secondary text-sm shrink-0 whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" /> Upload
                  <input type="file" accept="image/*" onChange={uploadHeroImage} className="hidden" />
                </label>
              </div>
              {local['hero_image_url'] && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-border" style={{ height: 90 }}>
                  <img src={local['hero_image_url']} alt="hero preview" className="w-full h-full object-cover" />
                  <button onClick={() => set('hero_image_url', '')}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white text-xs px-2 py-0.5 rounded hover:bg-black/80">
                    Remove
                  </button>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-1.5">This image is used as a full-screen backdrop behind the gradient and overlay.</p>
            </div>
          </TabsContent>

          {/* AI Features tab */}
          <TabsContent value="ai" className="space-y-5 mt-4">
            <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg border border-border/50">
              <Bot className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toggle AI-powered features site-wide. Changes take effect immediately without a page reload.
              </p>
            </div>
            {[
              { key: 'ai_chat_enabled',         label: 'AI Chat Widget',            desc: 'Floating chat assistant on public pages' },
              { key: 'ai_similar_cars_enabled',  label: 'AI Similar Listings',       desc: 'Smart "You may also like" on car detail pages' },
              { key: 'ai_specs_assistant_enabled', label: 'AI Specs Q&A',           desc: 'Ask questions about a listing on detail page' },
              { key: 'ai_smart_search_enabled',  label: 'AI Smart Search Hints',    desc: 'Predictive search suggestions powered by AI' },
              { key: 'ai_compare_enabled',       label: 'AI Comparison Summary',    desc: 'AI-generated pros/cons when comparing cars' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
                <Switch
                  id={f.key}
                  checked={local[f.key] !== 'false'}
                  onCheckedChange={v => set(f.key, v ? 'true' : 'false')}
                  className="shrink-0"
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-4">
            {[
              { label: 'Facebook URL', key: 'social_facebook' },
              { label: 'Instagram URL', key: 'social_instagram' },
              { label: 'Twitter/X URL', key: 'social_twitter' },
              { label: 'YouTube URL', key: 'social_youtube' },
              { label: 'WhatsApp Number', key: 'whatsapp_number' },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</Label>
                <Input value={local[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="h-9 text-sm" placeholder="https://..." />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4">
            {[
              { label: 'Contact Email', key: 'contact_email' },
              { label: 'Contact Phone', key: 'contact_phone' },
              { label: 'Office Address', key: 'office_address' },
              { label: 'Business Hours', key: 'business_hours' },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</Label>
                <Input value={local[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="h-9 text-sm" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg border border-border/50">
              <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Show or hide homepage sections and live statistics. Changes take effect immediately.
              </p>
            </div>
            {/* Master auctions toggle */}
            <div className="flex items-center justify-between gap-4 py-3 border border-border/60 rounded-lg px-3 bg-secondary/40">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Auctions Feature</p>
                <p className="text-xs text-muted-foreground mt-0.5">Master toggle — hides ALL auction content, nav links, pages and filters sitewide</p>
              </div>
              <Switch id="auctions_feature_enabled" checked={local['auctions_feature_enabled'] !== 'false'} onCheckedChange={v => set('auctions_feature_enabled', v ? 'true' : 'false')} className="shrink-0" />
            </div>

            {/* Find My Car toggle */}
            <div className="flex items-center justify-between gap-4 py-3 border border-border/60 rounded-lg px-3 bg-secondary/40">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Find My Car (Car Request)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle the "Find My Car" page and feature sitewide</p>
              </div>
              <Switch id="find_my_car_enabled" checked={local['find_my_car_enabled'] !== 'false'} onCheckedChange={v => set('find_my_car_enabled', v ? 'true' : 'false')} className="shrink-0" />
            </div>

            {/* Wallet toggle */}
            <div className="flex items-center justify-between gap-4 py-3 border border-border/60 rounded-lg px-3 bg-secondary/40">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Wallet & Deposits</p>
                <p className="text-xs text-muted-foreground mt-0.5">Show or hide the Wallet feature, balances, and deposit options sitewide</p>
              </div>
              <Switch id="wallet_feature_enabled" checked={local['wallet_feature_enabled'] !== 'false'} onCheckedChange={v => set('wallet_feature_enabled', v ? 'true' : 'false')} className="shrink-0" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pt-1">Homepage Sections</p>
            {[
              { key: 'show_auctions_section',  label: 'Live Auctions Section',  desc: 'Display the Active Auctions block on the homepage' },
              { key: 'show_featured_cars',     label: 'Featured Cars Section',  desc: 'Display the Featured Listings block' },
              { key: 'show_brand_carousel',    label: 'Brand Carousel',         desc: 'Display the scrolling brand logos strip' },
              { key: 'show_browse_by_type',    label: 'Browse by Body Type',    desc: 'Display the body-type category grid' },
              { key: 'show_testimonials',      label: 'Testimonials',           desc: 'Display customer testimonials section' },
              { key: 'show_why_us',            label: 'Why Choose Us',          desc: 'Display the features / USP block' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
                <Switch id={f.key} checked={local[f.key] !== 'false'} onCheckedChange={v => set(f.key, v ? 'true' : 'false')} className="shrink-0" />
              </div>
            ))}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pt-2">Hero Live Statistics</p>
            {[
              { key: 'show_stat_vehicles',  label: 'Vehicles Listed',  desc: 'Count of active vehicles' },
              { key: 'show_stat_buyers',    label: 'Happy Buyers',     desc: 'Registered user count' },
              { key: 'show_stat_auctions',  label: 'Auctions Held',    desc: 'Total auction count' },
              { key: 'show_stat_sold',      label: 'Cars Sold',        desc: 'Count of sold vehicles' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
                <Switch id={f.key} checked={local[f.key] !== 'false'} onCheckedChange={v => set(f.key, v ? 'true' : 'false')} className="shrink-0" />
              </div>
            ))}
          </TabsContent>
          <TabsContent value="wallet" className="space-y-4 mt-4">
            <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg border border-border/50">
              <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure the bank account details users will see when they request to deposit funds into their wallet.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Bank Name</Label>
                <Input value={local['bank_name'] || ''} onChange={e => set('bank_name', e.target.value)} className="h-9 text-sm" placeholder="e.g. Meezan Bank" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Account Title</Label>
                <Input value={local['bank_account_title'] || ''} onChange={e => set('bank_account_title', e.target.value)} className="h-9 text-sm" placeholder="e.g. XYZ Automobiles Pvt Ltd" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Account Number</Label>
                <Input value={local['bank_account_number'] || ''} onChange={e => set('bank_account_number', e.target.value)} className="h-9 text-sm" placeholder="e.g. 0101-xxxxxxxxx" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">IBAN (Optional)</Label>
                <Input value={local['bank_iban'] || ''} onChange={e => set('bank_iban', e.target.value)} className="h-9 text-sm" placeholder="e.g. PK00 MEZN 0000 0000 0000 0000" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Branch Code</Label>
                <Input value={local['bank_branch_code'] || ''} onChange={e => set('bank_branch_code', e.target.value)} className="h-9 text-sm" placeholder="e.g. 0101" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Additional Instructions</Label>
              <Textarea value={local['bank_instructions'] || ''} onChange={e => set('bank_instructions', e.target.value)} className="min-h-[80px] text-sm" placeholder="e.g. Please add your Username in the transfer reference." />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
