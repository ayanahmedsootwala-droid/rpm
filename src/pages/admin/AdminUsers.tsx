import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, Trash2, UserCog, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatDate } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Profile { id: string; full_name: string | null; email: string | null; role: string | null; created_at: string; phone: string | null; }

const PAGE_SIZE = 20;
const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))]',
  dealership_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  dealership_salesperson: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dealership_viewer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  user: 'bg-muted text-muted-foreground',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  dealership_manager: 'Dealer Manager',
  dealership_salesperson: 'Salesperson',
  dealership_viewer: 'Dealer Viewer',
  user: 'User',
};

export default function AdminUsers() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('profiles').select('*', { count: 'exact' });
    if (roleFilter !== 'all') q = q.eq('role', roleFilter);
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, count } = await q.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    setUsers((data as Profile[]) || []);
    setTotal(count || 0);
    setLoading(false);
    setSelected(new Set());
  }, [search, roleFilter, page]);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    if (viewUser?.id === id) setViewUser(prev => prev ? { ...prev, role } : null);
    toast.success('Role updated');
  };

  const deleteUser = async () => {
    if (!deleteId) return;
    await supabase.from('profiles').delete().eq('id', deleteId);
    toast.success('User deleted'); setDeleteId(null); load();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const executeBulk = async () => {
    const ids = Array.from(selected);
    if (bulkAction === 'make_admin') {
      await supabase.from('profiles').update({ role: 'admin' }).in('id', ids);
      toast.success(`${ids.length} users promoted to admin`);
    } else if (bulkAction === 'make_user') {
      await supabase.from('profiles').update({ role: 'user' }).in('id', ids);
      toast.success(`${ids.length} users role set to user`);
    } else if (bulkAction === 'delete') {
      await supabase.from('profiles').delete().in('id', ids);
      toast.success(`${ids.length} users deleted`);
    }
    setConfirmBulk(false); setBulkAction(''); load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Users</h1>
            <p className="text-sm text-muted-foreground">{total.toLocaleString()} registered users</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="pl-9 h-9 text-sm" />
          </div>
          <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="dealership_manager">Dealer Manager</SelectItem>
              <SelectItem value="dealership_salesperson">Salesperson</SelectItem>
              <SelectItem value="dealership_viewer">Dealer Viewer</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selected.size} selected</Badge>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="h-9 text-sm w-48"><SelectValue placeholder="Bulk action..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="make_admin">Make Admin</SelectItem>
                  <SelectItem value="make_user">Set as User</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" className="h-9 border border-border" disabled={!bulkAction} onClick={() => setConfirmBulk(true)}>Apply</Button>
            </div>
          )}
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-10 text-left px-4 py-3"><Checkbox checked={selected.size === users.length && users.length > 0} onCheckedChange={() => selected.size === users.length ? setSelected(new Set()) : setSelected(new Set(users.map(u => u.id)))} /></th>
                  <th className="text-left">User</th>
                  <th className="text-left hidden md:table-cell">Email</th>
                  <th className="text-left hidden lg:table-cell">Joined</th>
                  <th className="text-left">Role</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={6} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td></tr>
                )) : users.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition-colors', selected.has(u.id) && 'bg-primary/5')}>
                    <td className="px-4 py-3"><Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggleSelect(u.id)} /></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{(u.full_name || u.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{u.full_name || '—'}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell"><p className="text-sm text-muted-foreground">{u.email}</p></td>
                    <td className="hidden lg:table-cell"><p className="text-xs text-muted-foreground">{formatDate(u.created_at)}</p></td>
                    <td>
                      <Select value={u.role || 'user'} onValueChange={v => updateRole(u.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-36 border-0 p-0">
                          <Badge className={cn('text-xs cursor-pointer', ROLE_STYLES[u.role || 'user'] || ROLE_STYLES.user)}>
                            {ROLE_LABELS[u.role || 'user'] || u.role || 'user'}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="dealership_manager">Dealer Manager</SelectItem>
                          <SelectItem value="dealership_salesperson">Salesperson</SelectItem>
                          <SelectItem value="dealership_viewer">Dealer Viewer</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setViewUser(u)}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 border border-border"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 border border-border"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewUser} onOpenChange={open => !open && setViewUser(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12"><AvatarFallback className="bg-primary/10 text-primary font-bold">{(viewUser.full_name || viewUser.email || 'U').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                <div><p className="font-semibold">{viewUser.full_name || '—'}</p><p className="text-muted-foreground text-xs">{viewUser.email}</p></div>
              </div>
              {[{ label: 'Phone', value: viewUser.phone || '—' }, { label: 'Joined', value: formatDate(viewUser.created_at) }, { label: 'User ID', value: viewUser.id.slice(0, 8) + '...' }].map(f => (
                <div key={f.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs">Role</p>
                <Select value={viewUser.role || 'user'} onValueChange={v => updateRole(viewUser.id, v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="dealership_manager">Dealer Manager</SelectItem>
                    <SelectItem value="dealership_salesperson">Salesperson</SelectItem>
                    <SelectItem value="dealership_viewer">Dealer Viewer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  To give dealership access, also link the user from Admin → Dealerships → Members.
                </p>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="ghost" size="sm" onClick={() => setViewUser(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the user and all associated data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle><AlertDialogDescription>Apply "{bulkAction}" to {selected.size} users?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={executeBulk} className={bulkAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
