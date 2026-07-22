import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Download, Trash2, ZoomIn, CheckCircle, AlertCircle, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompressedFile {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  format: string;
  savings: number;
  status: 'processing' | 'done' | 'error';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function AdminImageCompression() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [quality, setQuality] = useState(88);
  const [maxWidth, setMaxWidth] = useState('1920');
  const [outputFormat, setOutputFormat] = useState('webp');
  const [stripMeta, setStripMeta] = useState(true);
  const [progressive, setProgressive] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<CompressedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalOriginal = files.reduce((a, f) => a + f.originalSize, 0);
  const totalCompressed = files.reduce((a, f) => a + f.compressedSize, 0);
  const totalSavings = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  async function compressImage(file: File): Promise<CompressedFile> {
    const url = URL.createObjectURL(file);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      let w = bitmap.width;
      let h = bitmap.height;
      const mw = parseInt(maxWidth, 10);
      if (w > mw) { h = Math.round((h * mw) / w); w = mw; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      const mime = outputFormat === 'webp' ? 'image/webp' : outputFormat === 'jpg' ? 'image/jpeg' : 'image/png';
      // Always use quality ≥ 0.82 for WebP/JPEG to keep images sharp
      const q = outputFormat === 'png' ? 1 : Math.max(0.82, quality / 100);
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mime, q));
      const compressedUrl = blob ? URL.createObjectURL(blob) : url;
      return {
        id: crypto.randomUUID(),
        name: file.name,
        originalSize: file.size,
        compressedSize: blob?.size ?? file.size,
        originalUrl: url,
        compressedUrl,
        format: outputFormat.toUpperCase(),
        savings: blob ? Math.max(0, Math.round((1 - blob.size / file.size) * 100)) : 0,
        status: 'done',
      };
    } catch {
      return {
        id: crypto.randomUUID(), name: file.name,
        originalSize: file.size, compressedSize: file.size,
        originalUrl: url, compressedUrl: url,
        format: outputFormat.toUpperCase(), savings: 0, status: 'error',
      };
    }
  }

  async function processFiles(rawFiles: File[]) {
    const imageFiles = rawFiles.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) { toast.error('Please upload image files only.'); return; }
    setProcessing(true); setProgress(0);
    const results: CompressedFile[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const result = await compressImage(imageFiles[i]);
      results.push(result);
      setProgress(Math.round(((i + 1) / imageFiles.length) * 100));
    }
    setFiles(prev => [...prev, ...results]);
    setProcessing(false);
    toast.success(`Compressed ${results.length} image${results.length > 1 ? 's' : ''} successfully`);
  }

  function downloadFile(f: CompressedFile) {
    const a = document.createElement('a');
    a.href = f.compressedUrl;
    a.download = `compressed_${f.name.replace(/\.[^.]+$/, '')}.${outputFormat}`;
    a.click();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Image Compression</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Compress and optimise images for faster page loads</p>
          </div>
          {files.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setFiles([]); setPreviewFile(null); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Clear All
              </Button>
              <Button size="sm" onClick={() => { files.filter(f => f.status === 'done').forEach(f => downloadFile(f)); toast.success('Downloading all'); }}>
                <Download className="w-4 h-4 mr-1" /> Download All
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compression Settings</CardTitle>
              <CardDescription>Configure output quality and format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Output Format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP (recommended)</SelectItem>
                    <SelectItem value="jpg">JPEG</SelectItem>
                    <SelectItem value="png">PNG (lossless)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Quality</Label>
                  <span className="text-sm font-semibold text-gold">{quality}%</span>
                </div>
                <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={10} max={100} step={5} disabled={outputFormat === 'png'} />
                <p className="text-xs text-muted-foreground">
                  {quality >= 90 ? 'Near-lossless — best for print/archive' : quality >= 82 ? 'Sharp & efficient — recommended' : quality >= 60 ? 'Balanced — visible at 100% zoom' : 'Aggressive — noticeable quality loss'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Width (px)</Label>
                <Select value={maxWidth} onValueChange={setMaxWidth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3840">3840 (4K)</SelectItem>
                    <SelectItem value="1920">1920 (Full HD)</SelectItem>
                    <SelectItem value="1280">1280 (HD)</SelectItem>
                    <SelectItem value="800">800 (Thumbnail)</SelectItem>
                    <SelectItem value="400">400 (Icon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Strip metadata (EXIF)</Label>
                  <Switch checked={stripMeta} onCheckedChange={setStripMeta} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Progressive encoding</Label>
                  <Switch checked={progressive} onCheckedChange={setProgressive} />
                </div>
              </div>
              {files.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session Stats</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground text-xs">Original</p><p className="font-semibold">{formatBytes(totalOriginal)}</p></div>
                    <div><p className="text-muted-foreground text-xs">Compressed</p><p className="font-semibold">{formatBytes(totalCompressed)}</p></div>
                    <div><p className="text-muted-foreground text-xs">Files</p><p className="font-semibold">{files.length}</p></div>
                    <div><p className="text-muted-foreground text-xs">Saved</p><p className="font-semibold text-gold">{totalSavings}%</p></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)); }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 hover:bg-muted/40'}`}
            >
              <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => processFiles(Array.from(e.target.files || []))} />
              <FileImage className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-sm">Drop images here or <span className="text-gold">browse files</span></p>
              <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WebP, GIF — up to 20 MB each</p>
            </div>

            {processing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Compressing images…</span><span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            {previewFile && (
              <Card>
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm">Preview: {previewFile.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>Close</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Original — {formatBytes(previewFile.originalSize)}</p>
                      <img src={previewFile.originalUrl} alt="original" className="w-full rounded-lg object-cover aspect-video" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Compressed — {formatBytes(previewFile.compressedSize)}</p>
                      <img src={previewFile.compressedUrl} alt="compressed" className="w-full rounded-lg object-cover aspect-video" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {files.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{files.length} File{files.length > 1 ? 's' : ''} Compressed</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="data-table w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pl-4 pr-2 py-2.5 text-left">File</th>
                          <th className="px-2 py-2.5 text-right">Original</th>
                          <th className="px-2 py-2.5 text-right">Compressed</th>
                          <th className="px-2 py-2.5 text-right">Savings</th>
                          <th className="px-2 py-2.5 text-center">Format</th>
                          <th className="px-2 py-2.5 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map(f => (
                          <tr key={f.id} className="border-b border-border last:border-0">
                            <td className="pl-4 pr-2 py-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                {f.status === 'done' ? <CheckCircle className="w-4 h-4 text-success shrink-0" /> : <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                                <span className="truncate max-w-[180px] text-xs">{f.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-2.5 text-right text-xs tabular-nums">{formatBytes(f.originalSize)}</td>
                            <td className="px-2 py-2.5 text-right text-xs tabular-nums text-success">{formatBytes(f.compressedSize)}</td>
                            <td className="px-2 py-2.5 text-right">
                              <Badge variant="secondary" className={`text-xs ${f.savings > 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                {f.savings > 0 ? `-${f.savings}%` : '0%'}
                              </Badge>
                            </td>
                            <td className="px-2 py-2.5 text-center"><Badge variant="outline" className="text-xs">{f.format}</Badge></td>
                            <td className="px-2 py-2.5 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewFile(f)}><ZoomIn className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadFile(f)}><Download className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : !processing && (
              <div className="text-center py-10 text-muted-foreground">
                <FileImage className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No images compressed yet. Upload files above to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
