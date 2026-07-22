import { useState, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Upload, Download, Trash2, ZoomIn, ZoomOut, Eye, EyeOff,
  ScanSearch, CheckCircle, AlertCircle, RefreshCw, FileImage, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

interface PlateBox {
  x: number; y: number;
  width: number; height: number;
  confidence: number;
}

interface ProcessedImage {
  id: string;
  name: string;
  originalUrl: string;
  processedUrl: string | null;
  plates: PlateBox[];
  status: 'idle' | 'detecting' | 'done' | 'error';
  errorMsg?: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

/** Draw image onto canvas and apply Gaussian-style pixelation blur over plate regions */
function applyPlateBlur(
  img: HTMLImageElement,
  plates: PlateBox[],
  blurStrength: number,
  showOverlay: boolean
): Promise<string> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    plates.forEach(plate => {
      const px = Math.floor(plate.x * img.naturalWidth);
      const py = Math.floor(plate.y * img.naturalHeight);
      const pw = Math.ceil(plate.width  * img.naturalWidth);
      const ph = Math.ceil(plate.height * img.naturalHeight);

      // Pixelation blur — shrink then enlarge for blocky-blur effect
      const blockSize = Math.max(4, Math.floor(blurStrength / 5));
      const offscreen = document.createElement('canvas');
      offscreen.width  = pw;
      offscreen.height = ph;
      const octx = offscreen.getContext('2d')!;

      // Shrink to blockSize grid
      const tinyW = Math.max(1, Math.floor(pw / blockSize));
      const tinyH = Math.max(1, Math.floor(ph / blockSize));
      octx.drawImage(img, px, py, pw, ph, 0, 0, tinyW, tinyH);

      // Scale back up (nearest-neighbor = pixelated)
      octx.imageSmoothingEnabled = false;
      octx.drawImage(offscreen, 0, 0, tinyW, tinyH, 0, 0, pw, ph);

      // Apply the blurred region back to main canvas multiple times for strength
      ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < Math.max(2, Math.floor(blurStrength / 8)); i++) {
        ctx.drawImage(offscreen, px, py, pw, ph);
      }

      // Overlay tint for visibility in tool mode
      if (showOverlay) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.9)';
        ctx.lineWidth = 2;
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.font = `bold ${Math.max(10, Math.floor(ph * 0.35))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('BLURRED', px + pw / 2, py + ph / 2 + Math.floor(ph * 0.12));
      }
    });

    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
}

export default function AdminNumberPlateBlur() {
  const [images, setImages]           = useState<ProcessedImage[]>([]);
  const [blurStrength, setBlurStrength] = useState(40);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isDragging, setIsDragging]   = useState(false);
  const [previewId, setPreviewId]     = useState<string | null>(null);
  const [zoomPreview, setZoomPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: File[]) => {
    const imgs = files.filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { toast.error('Please upload image files only.'); return; }

    const newEntries: ProcessedImage[] = imgs.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      originalUrl: URL.createObjectURL(f),
      processedUrl: null,
      plates: [],
      status: 'idle',
    }));
    setImages(prev => [...prev, ...newEntries]);
  }, []);

  const detectAndBlur = useCallback(async (entry: ProcessedImage) => {
    setImages(prev => prev.map(i => i.id === entry.id ? { ...i, status: 'detecting', processedUrl: null } : i));

    try {
      // Convert image to base64
      const blob = await fetch(entry.originalUrl).then(r => r.blob());
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });

      const mimeType = blob.type || 'image/jpeg';

      // Call edge function
      const { data, error } = await supabase.functions.invoke('detect-number-plate', {
        body: { imageBase64: base64, mimeType },
      });

      if (error) {
        const msg = await error?.context?.text?.() || error.message;
        throw new Error(msg);
      }

      const plates: PlateBox[] = data?.plates || [];

      if (plates.length === 0) {
        setImages(prev => prev.map(i =>
          i.id === entry.id ? { ...i, status: 'done', plates: [], processedUrl: entry.originalUrl } : i
        ));
        toast.info(`No number plates detected in "${entry.name}"`);
        return;
      }

      // Apply blur on canvas
      const img = new Image();
      img.src = entry.originalUrl;
      await new Promise(r => { img.onload = r; });

      const processedUrl = await applyPlateBlur(img, plates, blurStrength, showOverlay);

      setImages(prev => prev.map(i =>
        i.id === entry.id ? { ...i, status: 'done', plates, processedUrl } : i
      ));
      toast.success(`Blurred ${plates.length} plate${plates.length > 1 ? 's' : ''} in "${entry.name}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImages(prev => prev.map(i =>
        i.id === entry.id ? { ...i, status: 'error', errorMsg: msg } : i
      ));
      toast.error(`Detection failed: ${msg}`);
    }
  }, [blurStrength, showOverlay]);

  const detectAll = () => {
    images.filter(i => i.status === 'idle' || i.status === 'error').forEach(detectAndBlur);
  };

  const reBlur = useCallback(async (entry: ProcessedImage) => {
    if (!entry.plates.length) return;
    const img = new Image();
    img.src = entry.originalUrl;
    await new Promise(r => { img.onload = r; });
    const processedUrl = await applyPlateBlur(img, entry.plates, blurStrength, showOverlay);
    setImages(prev => prev.map(i => i.id === entry.id ? { ...i, processedUrl } : i));
  }, [blurStrength, showOverlay]);

  const download = (entry: ProcessedImage) => {
    const url = entry.processedUrl || entry.originalUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = `blurred_${entry.name.replace(/\.[^.]+$/, '')}.jpg`;
    a.click();
  };

  const remove = (id: string) => setImages(prev => prev.filter(i => i.id !== id));
  const preview = images.find(i => i.id === previewId);
  const processing = images.some(i => i.status === 'detecting');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-[hsl(var(--gold))]" />
              <h1 className="text-xl font-semibold">AI Number Plate Blur</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              AI detects and blurs vehicle number plates — upload images and download privacy-safe versions.
            </p>
          </div>
          {images.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => { setImages([]); setPreviewId(null); }}>
                <Trash2 className="w-4 h-4 mr-1.5" /> Clear All
              </Button>
              <Button size="sm" onClick={detectAll} disabled={processing ||
                images.every(i => i.status === 'done' || i.status === 'detecting')}>
                <ScanSearch className="w-4 h-4 mr-1.5" />
                {processing ? 'Detecting…' : 'Detect & Blur All'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings panel */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Blur Settings</CardTitle>
              <CardDescription>Adjust detection and blur strength</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Blur Strength</Label>
                  <span className="text-sm font-semibold text-[hsl(var(--gold))]">{blurStrength}</span>
                </div>
                <Slider
                  value={[blurStrength]}
                  onValueChange={([v]) => setBlurStrength(v)}
                  min={10} max={80} step={5}
                />
                <p className="text-xs text-muted-foreground">
                  {blurStrength >= 60 ? 'Heavy blur — plate fully unreadable' :
                   blurStrength >= 35 ? 'Medium blur — recommended for privacy' :
                   'Light blur — reduces readability'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show detection overlay</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Yellow box marks blurred areas</p>
                </div>
                <Switch checked={showOverlay} onCheckedChange={setShowOverlay} />
              </div>
              {images.some(i => i.status === 'done' && i.plates.length > 0) && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                  images.filter(i => i.plates.length > 0).forEach(reBlur);
                  toast.success('Re-applied blur with new settings');
                }}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-apply to all
                </Button>
              )}
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session Stats</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-muted-foreground text-xs">Images</p><p className="font-semibold">{images.length}</p></div>
                  <div><p className="text-muted-foreground text-xs">Plates found</p><p className="font-semibold text-[hsl(var(--gold))]">{images.reduce((a, i) => a + i.plates.length, 0)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Processed</p><p className="font-semibold">{images.filter(i => i.status === 'done').length}</p></div>
                  <div><p className="text-muted-foreground text-xs">Errors</p><p className="font-semibold text-destructive">{images.filter(i => i.status === 'error').length}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]' : 'border-border hover:border-[hsl(var(--gold)/0.5)] hover:bg-muted/40'
              }`}
            >
              <input ref={inputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={e => addFiles(Array.from(e.target.files || []))} />
              <Shield className="w-9 h-9 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-sm">Drop car images here or <span className="text-[hsl(var(--gold))]">browse files</span></p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — AI will detect and blur all number plates</p>
            </div>

            {/* Preview lightbox */}
            {preview && (
              <Card>
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm truncate max-w-[280px]">{preview.name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setZoomPreview(z => !z)}>
                      {zoomPreview ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setPreviewId(null)}>
                      <EyeOff className="w-3.5 h-3.5 mr-1" /> Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Original</p>
                      <img src={preview.originalUrl} alt="original"
                        className={`w-full rounded-lg object-contain bg-muted ${zoomPreview ? 'max-h-96' : 'max-h-52'} transition-all`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Processed
                        {preview.plates.length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 text-[10px]">{preview.plates.length} plate{preview.plates.length > 1 ? 's' : ''}</Badge>
                        )}
                      </p>
                      {preview.processedUrl ? (
                        <img src={preview.processedUrl} alt="processed"
                          className={`w-full rounded-lg object-contain bg-muted ${zoomPreview ? 'max-h-96' : 'max-h-52'} transition-all`} />
                      ) : (
                        <div className="w-full rounded-lg bg-muted flex items-center justify-center max-h-52 aspect-video">
                          <p className="text-xs text-muted-foreground">Not processed yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {preview.plates.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Detected Plates</p>
                      <div className="flex flex-wrap gap-2">
                        {preview.plates.map((p, i) => (
                          <div key={i} className="text-xs bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.3)] rounded px-2 py-1">
                            Plate {i + 1} · {Math.round(p.confidence * 100)}% confidence
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Image list */}
            {images.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{images.length} Image{images.length > 1 ? 's' : ''}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="data-table w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pl-4 pr-2 py-2.5 text-left">Image</th>
                          <th className="px-2 py-2.5 text-center">Status</th>
                          <th className="px-2 py-2.5 text-center">Plates</th>
                          <th className="px-2 py-2.5 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {images.map(img => (
                          <tr key={img.id} className="border-b border-border last:border-0">
                            <td className="pl-4 pr-2 py-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-7 rounded overflow-hidden bg-muted shrink-0">
                                  <img src={img.processedUrl || img.originalUrl} alt=""
                                    className="w-full h-full object-cover" />
                                </div>
                                <span className="truncate max-w-[160px] text-xs font-medium">{img.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {img.status === 'idle' && (
                                <Badge variant="outline" className="text-xs">Pending</Badge>
                              )}
                              {img.status === 'detecting' && (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-3 h-3 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-muted-foreground">Scanning…</span>
                                </div>
                              )}
                              {img.status === 'done' && (
                                <div className="flex items-center justify-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                                  <span className="text-xs text-success">Done</span>
                                </div>
                              )}
                              {img.status === 'error' && (
                                <div className="flex items-center justify-center gap-1" title={img.errorMsg}>
                                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                                  <span className="text-xs text-destructive">Error</span>
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {img.plates.length > 0 ? (
                                <Badge className="text-xs bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]">
                                  {img.plates.length} found
                                </Badge>
                              ) : img.status === 'done' ? (
                                <span className="text-xs text-muted-foreground">None</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2.5 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {img.status === 'idle' || img.status === 'error' ? (
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                                    onClick={() => detectAndBlur(img)}>
                                    <ScanSearch className="w-3.5 h-3.5 mr-1" /> Detect
                                  </Button>
                                ) : null}
                                {img.status === 'done' && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                      onClick={() => setPreviewId(img.id)}>
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                      onClick={() => download(img)}>
                                      <Download className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => remove(img.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <ScanSearch className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-sm font-medium mb-1">No images yet</p>
                <p className="text-xs">Upload car images above to start blurring number plates with AI.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
