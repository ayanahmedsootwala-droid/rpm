import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Check, Building2, Eye, ChevronLeft, ChevronRight, Loader2, Users, UserPlus, UserMinus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatDate } from '@/lib/utils-xyz';
import { PAKISTANI_CITIES } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import type { Dealership } from '@/types/types';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const PAGE_SIZE = 20;
const EMPTY = { name: '', description: '', city: '', address: '', phone: '', email: '', website: '', is_verified: false, is_active: true };

const MEMBER_ROLE_STYLES: Record<string, string> = {
  dealership_manager: 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))]',
  dealership_salesperson: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dealership_viewer: 'bg-muted text-muted-foreground',
};
const MEMBER_ROLE_LABELS: Record<string, string> = {
  dealership_manager: 'Manager',
  dealership_salesperson: 'Salesperson',
  dealership_viewer: 'Viewer',
};

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile?: { full_name: string | null; email: string | null };
}

export default function AdminDealerships() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Dealership | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  // Members management state — user picker replaces email-only input (v32)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [activeDealership, setActiveDealership] = useState<Dealership | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [addMemberRole, setAddMemberRole] = useState('dealership_manager');
  const [addingMember, setAddingMember] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('dealerships').select('*', { count: 'exact' });
    if (search) q = q.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
    const { data, count } = await q.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    setItems((data as Dealership[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (d: Dealership) => {
    setEditItem(d);
    setForm({ name: d.name || '', description: d.description || '', city: d.city || '', address: d.address || '', phone: d.phone || '', email: d.email || '', website: d.website || '', is_verified: d.is_verified || false, is_active: d.is_active !== false });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.city) { toast.error('Name and city are required'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await supabase.from('dealerships').update(form).eq('id', editItem.id);
        toast.success('Dealership updated');
      } else {
        await supabase.from('dealerships').insert(form);
        toast.success('Dealership added');
      }
      setDialogOpen(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteDealership = async () => {
    if (!deleteId) return;
    await supabase.from('dealerships').delete().eq('id', deleteId);
    toast.success('Dealership deleted'); setDeleteId(null); load();
  };

  const toggleVerified = async (id: string, v: boolean) => {
    await supabase.from('dealerships').update({ is_verified: v }).eq('id', id);
    setItems(prev => prev.map(d => d.id === id ? { ...d, is_verified: v } : d));
    toast.success(v ? 'Dealership verified' : 'Verification removed');
  };

  // ── Members management ──────────────────────────────────────────────────
  const openMembers = async (d: Dealership) => {
    setActiveDealership(d);
    setMembersDialogOpen(true);
    setUserSearch('');
    setSelectedUser(null);
    setAddMemberRole('dealership_manager');
    // Load all registered users and existing members in parallel
    setUsersLoading(true);
    const [membersRes, usersRes] = await Promise.all([
      supabase.from('dealership_members').select('*, profile:profiles(full_name, email)').eq('dealership_id', d.id).order('created_at'),
      supabase.from('profiles').select('id, full_name, email').order('full_name', { ascending: true }).limit(500),
    ]);
    setMembers((membersRes.data as MemberRow[]) || []);
    setAllUsers((usersRes.data as UserProfile[]) || []);
    setUsersLoading(false);
    setMembersLoading(false);
  };

  const fetchMembers = async (dealershipId: string) => {
    const { data } = await supabase
      .from('dealership_members')
      .select('*, profile:profiles(full_name, email)')
      .eq('dealership_id', dealershipId)
      .order('created_at');
    setMembers((data as MemberRow[]) || []);
  };

  // Filtered user list — exclude already-linked members
  const filteredUsers = useMemo(() => {
    const memberUserIds = new Set(members.map(m => m.user_id));
    return allUsers.filter(u => {
      if (memberUserIds.has(u.id)) return false;
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [allUsers, members, userSearch]);

  const addMember = async () => {
    if (!selectedUser || !activeDealership) return;
    setAddingMember(true);
    try {
      const { data: existing } = await supabase
        .from('dealership_members').select('id')
        .eq('dealership_id', activeDealership.id).eq('user_id', selectedUser.id).maybeSingle();
      if (existing) { toast.error('User is already linked to this dealership'); return; }

      const { error: insertErr } = await supabase
        .from('dealership_members')
        .insert({ dealership_id: activeDealership.id, user_id: selectedUser.id, role: addMemberRole, is_active: true });
      if (insertErr) throw insertErr;

      // Sync profile role so isDealershipStaff resolves in AuthContext
      await supabase.from('profiles').update({ role: addMemberRole }).eq('id', selectedUser.id);

      toast.success(`${selectedUser.full_name || selectedUser.email} linked to dealership`);
      setSelectedUser(null);
      setUserSearch('');
      await fetchMembers(activeDealership.id);
    } catch (e) {
      toast.error('Failed to add member');
      console.error(e);
    } finally {
      setAddingMember(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberId || !activeDealership) return;
    const member = members.find(m => m.id === removeMemberId);
    await supabase.from('dealership_members').delete().eq('id', removeMemberId);
    if (member) await supabase.from('profiles').update({ role: 'user' }).eq('id', member.user_id);
    toast.success('Member removed — role reset to user');
    setRemoveMemberId(null);
    await fetchMembers(activeDealership.id);
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    const member = members.find(m => m.id === memberId);
    await supabase.from('dealership_members').update({ role: newRole }).eq('id', memberId);
    if (member) await supabase.from('profiles').update({ role: newRole }).eq('id', member.user_id);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    toast.success('Member role updated');
  };
  // ────────────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const setField = (k: keyof typeof EMPTY, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dealerships</h1>
            <p className="text-sm text-muted-foreground">{total} registered dealerships</p>
          </div>
          <Button onClick={openAdd} className="h-9 gap-2"><Plus className="w-4 h-4" /> Add</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search dealerships..." className="pl-9 h-9 text-sm" />
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left">Name</th>
                  <th className="text-left hidden md:table-cell">City</th>
                  <th className="text-left hidden lg:table-cell">Contact</th>
                  <th className="text-left hidden md:table-cell">Added</th>
                  <th className="text-left">Verified</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={6} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td></tr>
                )) : items.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No dealerships found</td></tr>
                ) : items.map(d => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          {d.logo_url ? <img src={d.logo_url} alt="" className="w-6 h-6 object-contain" /> : <Building2 className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-sm font-medium">{d.name}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell"><p className="text-sm">{d.city}</p></td>
                    <td className="hidden lg:table-cell"><p className="text-xs text-muted-foreground">{d.email || d.phone || '—'}</p></td>
                    <td className="hidden md:table-cell"><p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p></td>
                    <td>
                      <Switch checked={d.is_verified || false} onCheckedChange={v => toggleVerified(d.id, v)} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" title="Manage members" onClick={() => openMembers(d)}><Users className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" asChild><Link to={`/dealer/${d.id}`} target="_blank"><Eye className="w-3.5 h-3.5" /></Link></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(d)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {/* Add/Edit Dealership Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Dealership' : 'Add Dealership'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Name *</Label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">City *</Label>
              <Select value={form.city || 'none'} onValueChange={v => setField('city', v === 'none' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Select city</SelectItem>{PAKISTANI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Phone</Label>
              <Input value={form.phone} onChange={e => setField('phone', e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Email</Label>
              <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Website</Label>
              <Input value={form.website} onChange={e => setField('website', e.target.value)} className="h-9 text-sm" placeholder="https://" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Address</Label>
              <Input value={form.address} onChange={e => setField('address', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Description</Label>
              <Textarea value={form.description} onChange={e => setField('description', e.target.value)} className="text-sm min-h-[80px] resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_verified} onCheckedChange={v => setField('is_verified', v)} />
              <Label className="text-sm">Verified Partner</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setField('is_active', v)} />
              <Label className="text-sm">Active</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={open => { setMembersDialogOpen(open); if (!open) setRemoveMemberId(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {activeDealership?.name} — Members
            </DialogTitle>
          </DialogHeader>

          {/* Add member — user picker */}
          <div className="space-y-3 py-2 border-b border-border pb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Link a user</p>

            {/* Selected user chip */}
            {selectedUser ? (
              <div className="flex items-center gap-3 px-3 py-2.5 border border-primary/40 bg-primary/5 rounded-lg">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {(selectedUser.full_name || selectedUser.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedUser.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {/* User list */}
                {usersLoading ? (
                  <div className="space-y-1.5">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-border rounded-lg">
                    {userSearch ? 'No matching users found' : 'All registered users are already members'}
                  </p>
                ) : (
                  <ScrollArea className="h-44 border border-border rounded-lg">
                    <div className="p-1 space-y-0.5">
                      {filteredUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedUser(u); setUserSearch(''); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-left"
                        >
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                              {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.full_name || <span className="text-muted-foreground italic">No name</span>}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                <p className="text-xs text-muted-foreground">Select a user above to link them to this dealership.</p>
              </div>
            )}

            {/* Role + Add button row */}
            <div className="flex gap-2">
              <Select value={addMemberRole} onValueChange={setAddMemberRole}>
                <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dealership_manager">Manager</SelectItem>
                  <SelectItem value="dealership_salesperson">Salesperson</SelectItem>
                  <SelectItem value="dealership_viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-9 shrink-0 gap-1.5" onClick={addMember} disabled={addingMember || !selectedUser}>
                {addingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Link User
              </Button>
            </div>
          </div>

          {/* Current member list */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current members ({members.length})</p>
            {membersLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 border border-border rounded-xl">
                <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No members linked yet</p>
              </div>
            ) : (
              members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/20 transition-colors">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {(m.profile?.full_name || m.profile?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.profile?.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.profile?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={m.role} onValueChange={v => updateMemberRole(m.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-32 border-0 p-0">
                        <Badge className={cn('text-xs cursor-pointer', MEMBER_ROLE_STYLES[m.role] || 'bg-muted text-muted-foreground')}>
                          {MEMBER_ROLE_LABELS[m.role] || m.role}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dealership_manager">Manager</SelectItem>
                        <SelectItem value="dealership_salesperson">Salesperson</SelectItem>
                        <SelectItem value="dealership_viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                      onClick={() => setRemoveMemberId(m.id)}>
                      <UserMinus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setMembersDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove member confirmation */}
      <AlertDialog open={!!removeMemberId} onOpenChange={open => !open && setRemoveMemberId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>The user will lose access to the dealership portal and their role will be reset to user.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader><AlertDialogTitle>Delete Dealership?</AlertDialogTitle><AlertDialogDescription>All associated data will be removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteDealership} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
