import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Shield, User, Mail, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { formatDate } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null };
}

const ROLE_STYLES: Record<string, string> = {
  dealership_manager: 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))]',
  dealership_salesperson: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dealership_viewer: 'bg-muted text-muted-foreground',
};

const ROLE_LABELS: Record<string, string> = {
  dealership_manager: 'Manager',
  dealership_salesperson: 'Salesperson',
  dealership_viewer: 'Viewer',
};

export default function DealershipTeam() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', role: 'staff' });
  const [adding, setAdding] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('dealership_members').select('dealership_id').eq('user_id', user.id).eq('is_active', true).maybeSingle()
      .then(({ data }) => { if (data) setDealershipId(data.dealership_id); });
  }, [user]);

  const fetchMembers = useCallback(async () => {
    if (!dealershipId) return;
    setLoading(true);
    const { data } = await supabase.from('dealership_members')
      .select('*, profile:profiles(full_name, email, avatar_url)')
      .eq('dealership_id', dealershipId)
      .eq('is_active', true)
      .order('created_at');
    setMembers((data as TeamMember[]) || []);
    setLoading(false);
  }, [dealershipId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const addMember = async () => {
    if (!form.email) { toast.error('Enter an email address'); return; }
    setAdding(true);
    try {
      const { data: profileData } = await supabase.from('profiles').select('id').eq('email', form.email).maybeSingle();
      if (!profileData) { toast.error('No user found with that email'); return; }
      const { data: existing } = await supabase.from('dealership_members').select('id').eq('dealership_id', dealershipId!).eq('user_id', profileData.id).maybeSingle();
      if (existing) { toast.error('User is already a team member'); return; }
      await supabase.from('dealership_members').insert({ dealership_id: dealershipId, user_id: profileData.id, role: form.role, is_active: true });
      // Sync profile role so isDealershipStaff resolves correctly
      await supabase.from('profiles').update({ role: form.role }).eq('id', profileData.id);
      toast.success('Team member added successfully');
      setAddOpen(false);
      setForm({ email: '', role: 'dealership_salesperson' });
      fetchMembers();
    } catch { toast.error('Failed to add member'); }
    finally { setAdding(false); }
  };

  const updateRole = async (id: string, role: string) => {
    const member = members.find(m => m.id === id);
    await supabase.from('dealership_members').update({ role }).eq('id', id);
    if (member) await supabase.from('profiles').update({ role }).eq('id', member.user_id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    toast.success('Role updated');
  };

  const removeMember = async () => {
    if (!deleteId) return;
    const member = members.find(m => m.id === deleteId);
    await supabase.from('dealership_members').delete().eq('id', deleteId);
    // Reset profile role to 'user' after removal
    if (member) await supabase.from('profiles').update({ role: 'user' }).eq('id', member.user_id);
    setMembers(prev => prev.filter(m => m.id !== deleteId));
    toast.success('Member removed');
    setDeleteId(null);
  };

  return (
    <DealershipLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Team</h1>
            <p className="text-sm text-muted-foreground">{members.length} members</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="h-9 gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-xl">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No team members yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/20 transition-colors">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {(m.profile?.full_name || m.profile?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.profile?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />{m.profile?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={m.role} onValueChange={v => updateRole(m.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-32 border-0 p-0">
                      <Badge className={cn('text-xs cursor-pointer', ROLE_STYLES[m.role] || ROLE_STYLES.dealership_viewer)}>
                        {ROLE_LABELS[m.role] || m.role}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dealership_manager">Manager</SelectItem>
                      <SelectItem value="dealership_salesperson">Salesperson</SelectItem>
                      <SelectItem value="dealership_viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  {m.user_id !== user?.id && (
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Email Address</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="colleague@example.com" className="h-9 text-sm" type="email" />
              <p className="text-xs text-muted-foreground mt-1">The user must already have an account.</p>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dealership_manager">Manager</SelectItem>
                  <SelectItem value="dealership_salesperson">Salesperson</SelectItem>
                  <SelectItem value="dealership_viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={addMember} disabled={adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access to the dealership portal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DealershipLayout>
  );
}
