import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Check, Loader2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatDate } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import type { BlogPost } from '@/types/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const EMPTY = { title: '', slug: '', excerpt: '', content: '', category: 'news', featured_image: '', is_published: false, is_featured: false, meta_title: '', meta_description: '' };

export default function AdminBlog() {
  const { t } = useLanguage();
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('blog_posts').select('*');
    if (filter === 'published') q = q.eq('is_published', true);
    else if (filter === 'draft') q = q.eq('is_published', false);
    else if (filter === 'featured') q = q.eq('is_featured', true);
    if (search) q = q.ilike('title', `%${search}%`);
    const { data } = await q.order('created_at', { ascending: false });
    setItems((data as BlogPost[]) || []);
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (p: BlogPost) => {
    setEditItem(p);
    setForm({ title: p.title || '', slug: p.slug || '', excerpt: p.excerpt || '', content: p.content || '', category: p.category || 'news', featured_image: p.featured_image || '', is_published: p.is_published || false, is_featured: p.is_featured || false, meta_title: p.meta_title || '', meta_description: p.meta_description || '' });
    setDialogOpen(true);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-').slice(0, 80);

  const save = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug || generateSlug(form.title), published_at: form.is_published ? new Date().toISOString() : null };
    try {
      if (editItem) { await supabase.from('blog_posts').update(payload).eq('id', editItem.id); toast.success('Post updated'); }
      else { await supabase.from('blog_posts').insert(payload); toast.success('Post created'); }
      setDialogOpen(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deletePost = async () => {
    if (!deleteId) return;
    await supabase.from('blog_posts').delete().eq('id', deleteId);
    toast.success('Post deleted'); setDeleteId(null); load();
  };

  const togglePublish = async (id: string, val: boolean) => {
    await supabase.from('blog_posts').update({ is_published: val, published_at: val ? new Date().toISOString() : null }).eq('id', id);
    setItems(prev => prev.map(p => p.id === id ? { ...p, is_published: val } : p));
    toast.success(val ? 'Post published' : 'Post set to draft');
  };

  const setF = (k: keyof typeof EMPTY, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold">Blog Posts</h1><p className="text-sm text-muted-foreground">{items.length} posts</p></div>
          <Button onClick={openAdd} className="h-9 gap-2"><Plus className="w-4 h-4" /> New Post</Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." className="pl-9 h-9 text-sm" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left">Title</th>
                  <th className="text-left hidden md:table-cell">Category</th>
                  <th className="text-left hidden lg:table-cell">Date</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={5} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td></tr>
                )) : items.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No posts found</td></tr>
                ) : items.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        {p.is_featured && <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-current shrink-0" />}
                        <p className="text-sm font-medium truncate max-w-[240px]">{p.title}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{p.category}</Badge></td>
                    <td className="hidden lg:table-cell"><p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.is_published || false} onCheckedChange={v => togglePublish(p.id, v)} />
                        <span className="text-xs text-muted-foreground">{p.is_published ? 'Live' : 'Draft'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(p)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Post' : 'New Blog Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs mb-1.5 block">Title *</Label><Input value={form.title} onChange={e => { setF('title', e.target.value); if (!editItem) setF('slug', generateSlug(e.target.value)); }} className="h-9 text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs mb-1.5 block">Slug</Label><Input value={form.slug} onChange={e => setF('slug', e.target.value)} className="h-9 text-sm font-mono text-xs" /></div>
              <div>
                <Label className="text-xs mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={v => setF('category', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="tips">Tips</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs mb-1.5 block">Excerpt</Label><Textarea value={form.excerpt} onChange={e => setF('excerpt', e.target.value)} className="text-sm resize-none min-h-[60px]" /></div>
            <div><Label className="text-xs mb-1.5 block">Content</Label><Textarea value={form.content} onChange={e => setF('content', e.target.value)} className="text-sm resize-none min-h-[160px]" /></div>
            <div><Label className="text-xs mb-1.5 block">Featured Image URL</Label><Input value={form.featured_image} onChange={e => setF('featured_image', e.target.value)} className="h-9 text-sm" placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3"><Switch checked={form.is_published} onCheckedChange={v => setF('is_published', v)} /><Label className="text-sm">Published</Label></div>
              <div className="flex items-center gap-3"><Switch checked={form.is_featured} onCheckedChange={v => setF('is_featured', v)} /><Label className="text-sm">Featured</Label></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editItem ? 'Update' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader><AlertDialogTitle>Delete Post?</AlertDialogTitle><AlertDialogDescription>This post will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
