import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, Globe, Phone, Mail, MapPin, Instagram, Facebook, Twitter, Youtube, Palette, Shield, Upload, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useWebPConverter } from '@/hooks/useWebPConverter';
import { useLanguage } from '@/contexts/LanguageContext';

type Settings = Record<string, string>;

const SETTING_KEYS = [
  'site_name', 'site_tagline', 'site_description', 'site_logo_url', 'site_favicon_url',
  'contact_email', 'contact_phone', 'contact_phone_2', 'contact_whatsapp',
  'contact_address', 'contact_city', 'contact_country',
  'social_instagram', 'social_facebook', 'social_twitter', 'social_youtube',
  'theme_primary_color', 'theme_accent_color', 'footer_text', 'meta_keywords',
  'google_analytics_id', 'facebook_pixel_id', 'maintenance_mode',
];

export default function AdminBrandSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Settings>({});
  const [original, setOriginal] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const { convert } = useWebPConverter({ quality: 0.9, maxWidth: 800 });

  useEffect(() => { loadSettings(); }, []);

  // Apply favicon dynamically when it changes
  useEffect(() => {
    const favUrl = settings['site_favicon_url'];
    if (favUrl) {
      const existing = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (existing) {
        existing.href = favUrl;
      } else {
        const link = document.createElement('link');
        link.rel = 'icon'; link.href = favUrl;
        document.head.appendChild(link);
      }
    }
  }, [settings['site_favicon_url']]);

  async function loadSettings() {
    setLoading(true);
    const { data } = await supabase.from('site_settings').select('key, value');
    const map: Settings = {};
    (data || []).forEach((r: { key: string; value: string | null }) => { map[r.key] = r.value || ''; });
    if (!map['site_name']) map['site_name'] = 'XYZ Automobiles';
    if (!map['site_tagline']) map['site_tagline'] = "Pakistan's Premier Car Marketplace";
    if (!map['contact_country']) map['contact_country'] = 'Pakistan';
    setSettings(map); setOriginal(map); setLoading(false);
  }

  function update(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function saveAll() {
    setSaving(true);
    const changed = Object.entries(settings).filter(([k, v]) => original[k] !== v);
    if (changed.length === 0) { toast.info('No changes to save'); setSaving(false); return; }
    const upserts = changed.map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
    if (error) { toast.error('Failed to save settings'); }
    else { toast.success(`Saved ${changed.length} setting${changed.length > 1 ? 's' : ''}`); setOriginal({ ...settings }); }
    setSaving(false);
  }

  async function uploadImage(file: File, type: 'logo' | 'favicon'): Promise<string | null> {
    // Convert to WebP
    let processedFile: File;
    try {
      processedFile = await convert(file);
      toast.success(`Image converted to WebP`);
    } catch {
      processedFile = file;
    }

    const bucket = 'site-assets';
    const path = `${type}/${Date.now()}.webp`;

    // Ensure bucket exists
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

    const { error } = await supabase.storage.from(bucket).upload(path, processedFile, {
      contentType: 'image/webp', upsert: true
    });
    if (error) {
      // Try direct upload without bucket creation
      const { error: e2 } = await supabase.storage.from('site-assets').upload(path, processedFile, { contentType: 'image/webp', upsert: true });
      if (e2) { toast.error(`Upload failed: ${e2.message}`); return null; }
    }
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    return data?.publicUrl || null;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await uploadImage(file, 'logo');
    if (url) {
      update('site_logo_url', url);
      // Save immediately
      await supabase.from('site_settings').upsert({ key: 'site_logo_url', value: url }, { onConflict: 'key' });
      setOriginal(prev => ({ ...prev, site_logo_url: url }));
      toast.success('Logo uploaded and applied to site header');
    }
    setUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    const url = await uploadImage(file, 'favicon');
    if (url) {
      update('site_favicon_url', url);
      await supabase.from('site_settings').upsert({ key: 'site_favicon_url', value: url }, { onConflict: 'key' });
      setOriginal(prev => ({ ...prev, site_favicon_url: url }));
      toast.success('Favicon uploaded — browser tab updated');
    }
    setUploadingFavicon(false);
    if (faviconInputRef.current) faviconInputRef.current.value = '';
  }

  const isDirty = Object.entries(settings).some(([k, v]) => original[k] !== v);
  const S = (key: string) => settings[key] || '';

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Brand Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage site identity, contact info, and integrations</p>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Unsaved changes</Badge>}
            <Button onClick={saveAll} disabled={saving || !isDirty}>
              <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving…' : 'Save All'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : (
          <Tabs defaultValue="identity">
            <TabsList className="mb-6 flex flex-wrap gap-1">
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="media">Logo & Favicon</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Identity Tab */}
            <TabsContent value="identity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Brand Identity</CardTitle>
                  <CardDescription>Core brand information shown throughout the site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">Site Name</Label>
                      <Input value={S('site_name')} onChange={e => update('site_name', e.target.value)} placeholder="XYZ Automobiles" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">Tagline</Label>
                      <Input value={S('site_tagline')} onChange={e => update('site_tagline', e.target.value)} placeholder="Pakistan's Premier Car Marketplace" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Site Description</Label>
                    <Textarea value={S('site_description')} onChange={e => update('site_description', e.target.value)} placeholder="Brief description for SEO and metadata…" rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Meta Keywords</Label>
                    <Input value={S('meta_keywords')} onChange={e => update('meta_keywords', e.target.value)} placeholder="cars, pakistan, used cars, buy sell cars" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Footer Text</Label>
                    <Input value={S('footer_text')} onChange={e => update('footer_text', e.target.value)} placeholder="© 2025 XYZ Automobiles. All rights reserved." />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />Theme Colours</CardTitle>
                  <CardDescription>Override the default colour scheme (hex values)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">Primary Colour</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={S('theme_primary_color') || '#1a1f2e'} onChange={e => update('theme_primary_color', e.target.value)} className="h-9 w-10 rounded border border-border cursor-pointer" />
                        <Input value={S('theme_primary_color')} onChange={e => update('theme_primary_color', e.target.value)} placeholder="#1a1f2e" className="font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">Accent Colour</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={S('theme_accent_color') || '#c49318'} onChange={e => update('theme_accent_color', e.target.value)} className="h-9 w-10 rounded border border-border cursor-pointer" />
                        <Input value={S('theme_accent_color')} onChange={e => update('theme_accent_color', e.target.value)} placeholder="#c49318" className="font-mono" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Site Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Maintenance Mode</p>
                      <p className="text-xs text-muted-foreground">When enabled, visitors see a maintenance page</p>
                    </div>
                    <Switch checked={S('maintenance_mode') === 'true'} onCheckedChange={v => update('maintenance_mode', v ? 'true' : 'false')} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logo & Favicon Tab */}
            <TabsContent value="media" className="space-y-6">
              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" />Site Logo</CardTitle>
                  <CardDescription>Shown in the header navigation bar. Auto-converted to WebP on upload.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Preview */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-48 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
                        {S('site_logo_url') ? (
                          <img src={S('site_logo_url')} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">No logo</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Header preview</p>
                    </div>
                    {/* Controls */}
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-normal">Logo URL (paste or upload)</Label>
                        <Input value={S('site_logo_url')} onChange={e => update('site_logo_url', e.target.value)} placeholder="https://…/logo.png or upload below" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="h-9">
                          {uploadingLogo ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading…</> : <><Upload className="w-3.5 h-3.5 mr-1.5" />Upload Logo</>}
                        </Button>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        {S('site_logo_url') && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => { update('site_logo_url', ''); }} className="h-9 text-destructive hover:text-destructive">
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Recommended: PNG/SVG with transparent background, min 200×60px. Auto-converted to WebP.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Favicon Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {S('site_favicon_url') ? <img src={S('site_favicon_url')} alt="" className="w-full h-full object-cover" /> : <Globe className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    Site Favicon
                  </CardTitle>
                  <CardDescription>Small icon shown in browser tabs and bookmarks. Updates the browser tab instantly on upload.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Preview */}
                    <div className="flex flex-col items-center gap-3">
                      {/* Mock browser tab */}
                      <div className="w-48 bg-muted/50 rounded-t-lg border border-border overflow-hidden">
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-background border-b border-border">
                          <div className="w-4 h-4 rounded overflow-hidden bg-muted shrink-0">
                            {S('site_favicon_url') ? <img src={S('site_favicon_url')} alt="" className="w-full h-full object-cover" /> : <Globe className="w-4 h-4 text-muted-foreground p-0.5" />}
                          </div>
                          <span className="text-xs truncate text-muted-foreground">{S('site_name') || 'XYZ Automobiles'}</span>
                        </div>
                        <div className="h-6 bg-muted/20" />
                      </div>
                      <p className="text-xs text-muted-foreground">Browser tab preview</p>
                    </div>
                    {/* Controls */}
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-normal">Favicon URL (paste or upload)</Label>
                        <Input value={S('site_favicon_url')} onChange={e => update('site_favicon_url', e.target.value)} placeholder="https://…/favicon.ico or upload below" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon} className="h-9">
                          {uploadingFavicon ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading…</> : <><Upload className="w-3.5 h-3.5 mr-1.5" />Upload Favicon</>}
                        </Button>
                        <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} />
                        {S('site_favicon_url') && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => update('site_favicon_url', '')} className="h-9 text-destructive hover:text-destructive">
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Recommended: 32×32px or 64×64px square PNG/ICO. Auto-converted to WebP.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                  <CardDescription>Displayed in footer, contact page, and header</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Primary Email</Label>
                      <Input type="email" value={S('contact_email')} onChange={e => update('contact_email', e.target.value)} placeholder="info@xyzautomobiles.pk" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Primary Phone</Label>
                      <Input value={S('contact_phone')} onChange={e => update('contact_phone', e.target.value)} placeholder="+92 300 1234567" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Secondary Phone</Label>
                      <Input value={S('contact_phone_2')} onChange={e => update('contact_phone_2', e.target.value)} placeholder="+92 21 3456789" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />WhatsApp Number</Label>
                      <Input value={S('contact_whatsapp')} onChange={e => update('contact_whatsapp', e.target.value)} placeholder="+92 300 1234567" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Street Address</Label>
                    <Textarea value={S('contact_address')} onChange={e => update('contact_address', e.target.value)} placeholder="Plot 15, DHA Phase 5, Auto Showroom Area" rows={2} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">City</Label>
                      <Input value={S('contact_city')} onChange={e => update('contact_city', e.target.value)} placeholder="Lahore" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">Country</Label>
                      <Input value={S('contact_country')} onChange={e => update('contact_country', e.target.value)} placeholder="Pakistan" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social Media Links</CardTitle>
                  <CardDescription>Links displayed in the footer and social section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'social_instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/xyzautomobiles' },
                    { key: 'social_facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/xyzautomobiles' },
                    { key: 'social_twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/xyzautomobiles' },
                    { key: 'social_youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@xyzautomobiles' },
                  ].map(({ key, label, icon: Icon, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-sm font-normal flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</Label>
                      <Input value={S(key)} onChange={e => update(key, e.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" />Tracking & Analytics</CardTitle>
                  <CardDescription>Third-party analytics and pixel integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Google Analytics Measurement ID</Label>
                    <Input value={S('google_analytics_id')} onChange={e => update('google_analytics_id', e.target.value)} placeholder="G-XXXXXXXXXX" className="font-mono" />
                    <p className="text-xs text-muted-foreground">Find this in your Google Analytics 4 property settings</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Facebook Pixel ID</Label>
                    <Input value={S('facebook_pixel_id')} onChange={e => update('facebook_pixel_id', e.target.value)} placeholder="123456789012345" className="font-mono" />
                    <p className="text-xs text-muted-foreground">Used for Facebook/Instagram ad conversion tracking</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
