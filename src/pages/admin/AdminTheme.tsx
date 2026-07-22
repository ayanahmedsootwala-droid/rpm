import { useState, useCallback } from 'react';
import { Save, RefreshCw, Palette, Check, Type, Eye, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ColorToken { key: string; label: string; value: string; darkValue: string; }

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  accent: string; // hex for swatch preview
  tokens: Record<string, string>; // key → HSL light value
  darkTokens: Record<string, string>; // key → HSL dark value
}

interface FontPreset {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontUrl: string;
  sample: string;
}

// ─── Color helpers ─────────────────────────────────────────────────────────────
const hslToHex = (hsl: string): string => {
  try {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
    const sl = s / 100, ll = l / 100;
    const a = sl * Math.min(ll, 1 - ll);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch { return '#000000'; }
};

const hexToHsl = (hex: string): string => {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return `0 0% ${Math.round(l * 100)}%`;
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch { return '0 0% 0%'; }
};

// ─── Default tokens ───────────────────────────────────────────────────────────
const DEFAULT_TOKENS: ColorToken[] = [
  { key: '--primary',           label: 'Primary',            value: '220 13% 10%',       darkValue: '220 14% 95%' },
  { key: '--primary-foreground',label: 'Primary Foreground', value: '0 0% 100%',          darkValue: '220 20% 7%' },
  { key: '--secondary',         label: 'Secondary',          value: '220 14% 97%',        darkValue: '220 14% 13%' },
  { key: '--accent',            label: 'Accent',             value: '36 33% 95%',         darkValue: '38 20% 14%' },
  { key: '--gold',              label: 'Gold (Brand)',        value: '38 80% 42%',         darkValue: '38 80% 52%' },
  { key: '--background',        label: 'Background',         value: '0 0% 100%',          darkValue: '220 20% 7%' },
  { key: '--foreground',        label: 'Foreground',         value: '220 13% 10%',        darkValue: '220 14% 95%' },
  { key: '--muted',             label: 'Muted',              value: '220 14% 96%',        darkValue: '220 14% 13%' },
  { key: '--muted-foreground',  label: 'Muted Foreground',   value: '220 9% 44%',         darkValue: '220 9% 60%' },
  { key: '--border',            label: 'Border',             value: '220 13% 90%',        darkValue: '220 13% 17%' },
  { key: '--destructive',       label: 'Destructive',        value: '0 72% 51%',          darkValue: '0 62% 42%' },
  { key: '--sidebar-background',label: 'Sidebar Background', value: '220 16% 8%',         darkValue: '220 22% 5%' },
  { key: '--sidebar-primary',   label: 'Sidebar Primary',    value: '38 80% 48%',         darkValue: '38 80% 48%' },
];

// ─── 5 Theme Presets ──────────────────────────────────────────────────────────
const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Classic dark ink on white — timeless automotive luxury',
    accent: '#1a1f2e',
    tokens: {
      '--primary': '220 13% 10%', '--primary-foreground': '0 0% 100%',
      '--gold': '38 80% 42%', '--accent': '36 33% 95%',
      '--background': '0 0% 100%', '--foreground': '220 13% 10%',
      '--muted': '220 14% 96%', '--muted-foreground': '220 9% 44%',
      '--border': '220 13% 90%', '--sidebar-background': '220 16% 8%',
      '--sidebar-primary': '38 80% 48%', '--secondary': '220 14% 97%',
    },
    darkTokens: {
      '--primary': '220 14% 95%', '--primary-foreground': '220 20% 7%',
      '--gold': '38 80% 52%', '--accent': '38 20% 14%',
      '--background': '220 20% 7%', '--foreground': '220 14% 95%',
      '--muted': '220 14% 13%', '--muted-foreground': '220 9% 60%',
      '--border': '220 13% 17%', '--sidebar-background': '220 22% 5%',
      '--sidebar-primary': '38 80% 48%', '--secondary': '220 14% 13%',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson Edge',
    description: 'Bold red accent — performance & passion',
    accent: '#c0392b',
    tokens: {
      '--primary': '4 70% 38%', '--primary-foreground': '0 0% 100%',
      '--gold': '4 70% 44%', '--accent': '4 40% 96%',
      '--background': '0 0% 100%', '--foreground': '4 15% 12%',
      '--muted': '4 15% 96%', '--muted-foreground': '4 8% 44%',
      '--border': '4 12% 89%', '--sidebar-background': '4 40% 8%',
      '--sidebar-primary': '4 70% 50%', '--secondary': '4 15% 97%',
    },
    darkTokens: {
      '--primary': '4 70% 60%', '--primary-foreground': '4 40% 8%',
      '--gold': '4 70% 55%', '--accent': '4 30% 14%',
      '--background': '4 18% 8%', '--foreground': '4 14% 95%',
      '--muted': '4 14% 13%', '--muted-foreground': '4 9% 60%',
      '--border': '4 13% 17%', '--sidebar-background': '4 24% 5%',
      '--sidebar-primary': '4 70% 52%', '--secondary': '4 14% 13%',
    },
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    description: 'Deep blue prestige — trust and precision',
    accent: '#1a3a6b',
    tokens: {
      '--primary': '220 60% 22%', '--primary-foreground': '0 0% 100%',
      '--gold': '43 85% 46%', '--accent': '220 50% 96%',
      '--background': '0 0% 100%', '--foreground': '220 30% 12%',
      '--muted': '220 25% 96%', '--muted-foreground': '220 15% 44%',
      '--border': '220 20% 89%', '--sidebar-background': '220 50% 8%',
      '--sidebar-primary': '43 85% 50%', '--secondary': '220 25% 97%',
    },
    darkTokens: {
      '--primary': '220 60% 68%', '--primary-foreground': '220 50% 8%',
      '--gold': '43 85% 54%', '--accent': '220 40% 14%',
      '--background': '220 25% 7%', '--foreground': '220 14% 94%',
      '--muted': '220 20% 13%', '--muted-foreground': '220 12% 60%',
      '--border': '220 18% 17%', '--sidebar-background': '220 30% 5%',
      '--sidebar-primary': '43 85% 50%', '--secondary': '220 20% 13%',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy green — SUV spirit and sustainability',
    accent: '#1e5c3a',
    tokens: {
      '--primary': '145 55% 18%', '--primary-foreground': '0 0% 100%',
      '--gold': '38 80% 44%', '--accent': '145 35% 95%',
      '--background': '0 0% 100%', '--foreground': '145 20% 10%',
      '--muted': '145 15% 96%', '--muted-foreground': '145 8% 44%',
      '--border': '145 14% 89%', '--sidebar-background': '145 40% 7%',
      '--sidebar-primary': '38 80% 48%', '--secondary': '145 15% 97%',
    },
    darkTokens: {
      '--primary': '145 55% 58%', '--primary-foreground': '145 40% 7%',
      '--gold': '38 80% 52%', '--accent': '145 25% 13%',
      '--background': '145 18% 7%', '--foreground': '145 14% 94%',
      '--muted': '145 14% 13%', '--muted-foreground': '145 8% 60%',
      '--border': '145 12% 17%', '--sidebar-background': '145 25% 5%',
      '--sidebar-primary': '38 80% 48%', '--secondary': '145 14% 13%',
    },
  },
  {
    id: 'slate',
    name: 'Slate Pro',
    description: 'Cool neutral slate — clean, modern dealership feel',
    accent: '#475569',
    tokens: {
      '--primary': '215 25% 27%', '--primary-foreground': '0 0% 100%',
      '--gold': '38 80% 44%', '--accent': '215 20% 95%',
      '--background': '0 0% 100%', '--foreground': '215 20% 12%',
      '--muted': '215 15% 96%', '--muted-foreground': '215 10% 44%',
      '--border': '215 15% 89%', '--sidebar-background': '215 30% 9%',
      '--sidebar-primary': '38 80% 50%', '--secondary': '215 15% 97%',
    },
    darkTokens: {
      '--primary': '215 25% 72%', '--primary-foreground': '215 30% 9%',
      '--gold': '38 80% 52%', '--accent': '215 18% 14%',
      '--background': '215 22% 7%', '--foreground': '215 14% 94%',
      '--muted': '215 16% 13%', '--muted-foreground': '215 10% 60%',
      '--border': '215 14% 17%', '--sidebar-background': '215 28% 5%',
      '--sidebar-primary': '38 80% 48%', '--secondary': '215 16% 13%',
    },
  },
];

// ─── Font Presets ─────────────────────────────────────────────────────────────
const FONT_PRESETS: FontPreset[] = [
  {
    id: 'montserrat',
    name: 'Montserrat',
    description: 'Current — geometric, premium feel',
    fontFamily: "'Montserrat', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
    sample: 'The pinnacle of automotive excellence.',
  },
  {
    id: 'inter',
    name: 'Inter',
    description: 'Clean, highly legible — modern tech feel',
    fontFamily: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    sample: 'The pinnacle of automotive excellence.',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    description: 'Serif elegance — ultra-luxury, heritage brands',
    fontFamily: "'Playfair Display', serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap',
    sample: 'The pinnacle of automotive excellence.',
  },
  {
    id: 'raleway',
    name: 'Raleway',
    description: 'Thin & airy — boutique / lifestyle dealerships',
    fontFamily: "'Raleway', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap',
    sample: 'The pinnacle of automotive excellence.',
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    description: 'Neutral, friendly — approachable marketplace',
    fontFamily: "'DM Sans', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
    sample: 'The pinnacle of automotive excellence.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminTheme() {
  const { updateSetting, refresh } = useSiteSettingsContext();
  const [tokens, setTokens] = useState<ColorToken[]>(DEFAULT_TOKENS);
  const [activePreset, setActivePreset] = useState<string>('midnight');
  const [activeFont, setActiveFont] = useState<string>('montserrat');
  const [previewApplied, setPreviewApplied] = useState(false);

  // Apply all CSS vars from a preset to :root (live preview)
  const applyPresetToDOM = useCallback((preset: ThemePreset) => {
    const isDark = document.documentElement.classList.contains('dark');
    const source = isDark ? preset.darkTokens : preset.tokens;
    Object.entries(source).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }, []);

  const applyFontToDOM = useCallback((font: FontPreset) => {
    // Inject Google Font link if not already present
    const linkId = `theme-font-${font.id}`;
    if (!document.getElementById(linkId) && font.fontUrl.includes('fonts.googleapis')) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = font.fontUrl;
      document.head.appendChild(link);
    }
    document.documentElement.style.setProperty('--font-body', font.fontFamily);
    // Apply directly to body for immediate effect
    document.body.style.fontFamily = font.fontFamily;
    const allText = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,button,input,label');
    allText.forEach((el) => { (el as HTMLElement).style.fontFamily = font.fontFamily; });
  }, []);

  const handleSelectPreset = (preset: ThemePreset) => {
    setActivePreset(preset.id);
    // Update tokens state
    setTokens(prev => prev.map(tok => {
      const lightVal = preset.tokens[tok.key];
      const darkVal  = preset.darkTokens[tok.key];
      return {
        ...tok,
        value:     lightVal ?? tok.value,
        darkValue: darkVal  ?? tok.darkValue,
      };
    }));
    applyPresetToDOM(preset);
    setPreviewApplied(true);
    toast.success(`"${preset.name}" preset applied — live preview active`);
  };

  const handleSelectFont = (font: FontPreset) => {
    setActiveFont(font.id);
    applyFontToDOM(font);
    toast.success(`Font changed to ${font.name}`);
  };

  const updateToken = (key: string, hslValue: string) => {
    setTokens(prev => prev.map(t => t.key === key ? { ...t, value: hslValue } : t));
    document.documentElement.style.setProperty(key, hslValue);
    setPreviewApplied(true);
  };

  const applyManualPreview = () => {
    tokens.forEach(t => document.documentElement.style.setProperty(t.key, t.value));
    setPreviewApplied(true);
    toast.success('Preview applied to page');
  };

  const resetAll = () => {
    setTokens(DEFAULT_TOKENS);
    setActivePreset('midnight');
    setActiveFont('montserrat');
    setPreviewApplied(false);
    DEFAULT_TOKENS.forEach(t => document.documentElement.style.removeProperty(t.key));
    document.body.style.fontFamily = '';
    const allText = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,button,input,label');
    allText.forEach((el) => { (el as HTMLElement).style.fontFamily = ''; });
    toast.info('Theme reset to defaults');
  };

  const exportCSS = () => {
    const selectedFont = FONT_PRESETS.find(f => f.id === activeFont)!;
    const fontImport = selectedFont.fontUrl.includes('googleapis')
      ? `@import url('${selectedFont.fontUrl}');\n\n`
      : '';
    const lightVars = tokens.map(t => `  ${t.key}: ${t.value};`).join('\n');
    const darkVars  = tokens.map(t => `  ${t.key}: ${t.darkValue};`).join('\n');
    const css =
      `${fontImport}/* Theme: ${THEME_PRESETS.find(p => p.id === activePreset)?.name || 'Custom'} */\n` +
      `/* Font: ${selectedFont.name} */\n\n` +
      `:root {\n${lightVars}\n  --font-body: ${selectedFont.fontFamily};\n}\n\n` +
      `.dark {\n${darkVars}\n}\n\n` +
      `html, body { font-family: ${selectedFont.fontFamily}; }`;
    const blob = new Blob([css], { type: 'text/css' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `theme-${activePreset}-${activeFont}.css`;
    a.click();
    toast.success('CSS exported successfully');
  };

  const currentFont = FONT_PRESETS.find(f => f.id === activeFont)!;

  const getThemeCSS = () => {
    const selectedFont = FONT_PRESETS.find(f => f.id === activeFont)!;
    const fontImport = selectedFont.fontUrl.includes('googleapis')
      ? `@import url('${selectedFont.fontUrl}');\n\n`
      : '';
    const lightVars = tokens.map(t => `  ${t.key}: ${t.value} !important;`).join('\n');
    const darkVars  = tokens.map(t => `  ${t.key}: ${t.darkValue} !important;`).join('\n');
    const css =
      `${fontImport}/* Theme: ${THEME_PRESETS.find(p => p.id === activePreset)?.name || 'Custom'} */\n` +
      `/* Font: ${selectedFont.name} */\n\n` +
      `:root {\n${lightVars}\n  --font-body: ${selectedFont.fontFamily} !important;\n}\n\n` +
      `.dark {\n${darkVars}\n}\n\n` +
      `html, body { font-family: ${selectedFont.fontFamily} !important; }`;
    return css;
  };

  const saveThemeToSite = async () => {
    try {
      const css = getThemeCSS();
      const { error } = await updateSetting('theme_css', css);
      if (error) throw error;
      await refresh();
      toast.success('Theme successfully applied to all viewers!');
    } catch (err) {
      toast.error('Failed to save theme settings.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-balance">Theme Customization</h1>
            <p className="text-sm text-muted-foreground">Apply presets or fine-tune colors and fonts — preview updates live</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {previewApplied && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Eye className="w-3 h-3" /> Preview Active
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={resetAll} className="h-8 gap-1.5 border border-border text-xs">
              <RefreshCw className="w-3 h-3" /> Reset
            </Button>
            <Button size="sm" onClick={exportCSS} className="h-8 gap-1.5 text-xs bg-secondary text-foreground hover:bg-secondary/80">
              <Save className="w-3 h-3" /> Export CSS
            </Button>
            <Button size="sm" onClick={saveThemeToSite} className="h-8 gap-1.5 text-xs animate-pulse-glow">
              <CloudUpload className="w-3 h-3" /> Publish Theme
            </Button>
          </div>
        </div>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-5">
            <TabsTrigger value="presets" className="gap-1.5 text-xs"><Palette className="w-3.5 h-3.5" />Color Presets</TabsTrigger>
            <TabsTrigger value="fonts"   className="gap-1.5 text-xs"><Type    className="w-3.5 h-3.5" />Font Presets</TabsTrigger>
            <TabsTrigger value="manual"  className="gap-1.5 text-xs"><RefreshCw className="w-3.5 h-3.5"/>Fine-tune</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Color Presets ── */}
          <TabsContent value="presets" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {THEME_PRESETS.map(preset => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'text-left rounded-xl border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'border-primary bg-secondary shadow-sm'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/60'
                    )}
                  >
                    {/* Swatch row */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {/* Primary swatch */}
                        <div
                          className="w-8 h-8 rounded-lg border border-border/50 shrink-0"
                          style={{ backgroundColor: `hsl(${preset.tokens['--primary']})` }}
                        />
                        {/* Gold swatch */}
                        <div
                          className="w-8 h-8 rounded-lg border border-border/50 shrink-0"
                          style={{ backgroundColor: `hsl(${preset.tokens['--gold']})` }}
                        />
                        {/* Sidebar swatch */}
                        <div
                          className="w-8 h-8 rounded-lg border border-border/50 shrink-0"
                          style={{ backgroundColor: `hsl(${preset.tokens['--sidebar-background']})` }}
                        />
                        {/* Accent swatch */}
                        <div
                          className="w-8 h-8 rounded-lg border border-border/50 shrink-0"
                          style={{ backgroundColor: `hsl(${preset.tokens['--accent']})` }}
                        />
                      </div>
                      {isActive && (
                        <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      )}
                    </div>
                    {/* Mini live preview card */}
                    <div
                      className="rounded-lg p-3 mb-3 border"
                      style={{
                        background: `hsl(${preset.tokens['--background']})`,
                        borderColor: `hsl(${preset.tokens['--border']})`,
                      }}
                    >
                      <div
                        className="text-xs font-semibold mb-1"
                        style={{ color: `hsl(${preset.tokens['--foreground']})` }}
                      >
                        2024 BMW 3 Series
                      </div>
                      <div
                        className="text-xs mb-2"
                        style={{ color: `hsl(${preset.tokens['--muted-foreground']})` }}
                      >
                        PKR 85 Lac · Lahore
                      </div>
                      <div className="flex gap-1.5">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                          style={{
                            backgroundColor: `hsl(${preset.tokens['--primary']})`,
                            color: `hsl(${preset.tokens['--primary-foreground']})`,
                          }}
                        >
                          View
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                          style={{
                            backgroundColor: `hsl(${preset.tokens['--gold']})`,
                            color: '#fff',
                          }}
                        >
                          Featured
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{preset.description}</p>
                  </button>
                );
              })}
            </div>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
                <CardDescription className="text-xs">This page is already showing the selected theme. Navigate the admin panel to see it applied site-wide.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  {/* Simulated nav bar */}
                  <div className="h-10 bg-sidebar-background flex items-center px-4 gap-3">
                    <div className="w-2 h-2 rounded-full bg-sidebar-primary" />
                    <div className="text-[11px] font-semibold text-sidebar-foreground">XYZ Automobiles Admin</div>
                    <div className="ml-auto flex gap-2">
                      {['Dashboard','Inventory','Users'].map(n => (
                        <span key={n} className="text-[10px] text-sidebar-foreground/60">{n}</span>
                      ))}
                    </div>
                  </div>
                  {/* Simulated content */}
                  <div className="bg-background p-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Listings', value: '1,240', accent: false },
                      { label: 'Active',         value: '892',   accent: true  },
                      { label: 'Pending',        value: '48',    accent: false },
                    ].map(stat => (
                      <div key={stat.label} className={cn('rounded-lg p-3 border border-border', stat.accent ? 'bg-accent' : 'bg-card')}>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        <p className="text-sm font-bold text-foreground">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-background px-4 pb-4">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[11px] font-medium text-foreground mb-1">2024 Toyota Corolla GLi</p>
                      <p className="text-[10px] text-muted-foreground mb-2">PKR 42 Lac · Used · Lahore</p>
                      <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium">Approve</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">Edit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: Font Presets ── */}
          <TabsContent value="fonts" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FONT_PRESETS.map(font => {
                const isActive = activeFont === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => handleSelectFont(font)}
                    className={cn(
                      'text-left rounded-xl border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'border-primary bg-secondary shadow-sm'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/60'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{font.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{font.description}</p>
                      </div>
                      {isActive && (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      )}
                    </div>
                    <Separator className="my-2" />
                    {/* Font sample — inject inline style since the font may not be loaded yet via CSS */}
                    <p
                      className="text-base font-medium text-foreground text-pretty"
                      style={{ fontFamily: font.fontFamily }}
                    >
                      {font.sample}
                    </p>
                    <p
                      className="text-xs text-muted-foreground mt-1"
                      style={{ fontFamily: font.fontFamily }}
                    >
                      Aa Bb Cc 0123 — The quick brown fox jumps
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Typography scale preview */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Typography Scale Preview</CardTitle>
                <CardDescription className="text-xs">Live render using the selected font: <strong>{currentFont.name}</strong></CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Display',   cls: 'text-3xl font-bold',     text: 'XYZ Automobiles' },
                  { label: 'Heading 1', cls: 'text-2xl font-semibold', text: 'Premium Cars in Pakistan' },
                  { label: 'Heading 2', cls: 'text-xl font-semibold',  text: 'Featured Listings' },
                  { label: 'Body',      cls: 'text-sm font-normal',    text: 'Browse thousands of verified cars across Pakistan with complete details.' },
                  { label: 'Caption',   cls: 'text-xs font-normal',    text: 'Last updated 2 hours ago · 1,240 listings' },
                ].map(row => (
                  <div key={row.label} className="flex items-baseline gap-4 py-2 border-b border-border last:border-0">
                    <p className="text-xs text-muted-foreground w-20 shrink-0">{row.label}</p>
                    <p
                      className={cn(row.cls, 'text-foreground flex-1 min-w-0')}
                      style={{ fontFamily: currentFont.fontFamily }}
                    >
                      {row.text}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: Fine-tune ── */}
          <TabsContent value="manual" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Edit individual color tokens (HSL format)</p>
              <Button variant="ghost" size="sm" onClick={applyManualPreview} className="h-8 gap-1.5 border border-border text-xs">
                <Eye className="w-3 h-3" /> Apply Preview
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4 space-y-2">
                {tokens.map(tok => (
                  <div key={tok.key} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-md border border-border shrink-0"
                      style={{ backgroundColor: `hsl(${tok.value})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono text-muted-foreground truncate">{tok.key}</p>
                      <p className="text-[11px] text-foreground">{tok.label}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="color"
                        value={hslToHex(tok.value)}
                        onChange={e => updateToken(tok.key, hexToHsl(e.target.value))}
                        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5"
                      />
                      <Input
                        value={tok.value}
                        onChange={e => updateToken(tok.key, e.target.value)}
                        className="h-8 text-xs font-mono w-36"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
