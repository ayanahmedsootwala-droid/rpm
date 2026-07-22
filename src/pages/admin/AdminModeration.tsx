import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate } from '@/lib/utils-xyz';
import type { Car, CarStatus } from '@/types/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminModeration() {
  const { t } = useLanguage();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('cars').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setCars(data as Car[]); setLoading(false); });
  }, []);

  const decide = async (id: string, status: CarStatus) => {
    await supabase.from('cars').update({ status }).eq('id', id);
    setCars(prev => prev.filter(c => c.id !== id));
    toast.success(`Listing ${status}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Content Moderation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cars.length} listings pending review</p>
        </div>
        {loading ? <div className="animate-pulse bg-muted rounded h-32" /> :
          cars.length === 0 ? <div className="text-center py-16 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground">No pending listings 🎉</p>
          </div> :
          <div className="space-y-3">
            {cars.map(car => (
              <div key={car.id} className="flex items-center gap-4 bg-card border border-border rounded-md p-3">
                {Array.isArray(car.images) && car.images[0] ? (
                  <img src={car.images[0]} alt={car.title} className="w-20 h-14 object-cover rounded-md shrink-0" />
                ) : <div className="w-20 h-14 bg-muted rounded-md shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{car.year} {car.brand_name} {car.model_name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(car.price)} · {car.registration_city || 'N/A'} · {formatDate(car.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                    <Link to={`/car/${car.id}`}><Eye className="w-4 h-4" /></Link>
                  </Button>
                  <Button size="sm" className="h-8 gap-1.5 bg-success hover:bg-success/90 text-white" onClick={() => decide(car.id, 'active')}>
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8 gap-1.5" onClick={() => decide(car.id, 'rejected')}>
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </AdminLayout>
  );
}
