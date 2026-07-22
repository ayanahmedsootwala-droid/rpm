import { useState } from 'react';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, Send, Car, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FindMyCarPage() {
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    brand: '',
    model: '',
    year: '',
    budget: '',
    additionalInfo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.brand || !form.model) {
      toast.error('Please fill in all required fields including Phone Number');
      return;
    }

    setSubmitting(true);
    try {
      const message = `[Car Request] 
Brand: ${form.brand}
Model: ${form.model}
Year: ${form.year || 'Any'}
Budget: ${form.budget || 'Not specified'}
Additional Info: ${form.additionalInfo || 'None'}`;

      const { error } = await supabase.from('inquiries').insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: message,
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success('Request submitted! We will contact you soon.');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to submit request: ' + (e.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{t('find_my_car')}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Can't find the exact car you're looking for? Let us know what you want, and our network of dealers will find it for you.
            </p>
          </div>

          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-success/30 rounded-2xl p-8 md:p-12 text-center"
            >
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Request Received!</h2>
              <p className="text-muted-foreground mb-8">
                Thank you, {form.name}. Our team is now searching for your perfect {form.brand} {form.model}. We will contact you at {form.email} as soon as we find a match.
              </p>
              <Button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', brand: '', model: '', year: '', budget: '', additionalInfo: '' }); }}>
                Submit Another Request
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 shadow-sm rounded-2xl p-6 md:p-10"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Vehicle Details */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                    <Car className="w-5 h-5 text-primary" /> Vehicle Requirements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label>Brand (Make) <span className="text-destructive">*</span></Label>
                      <Input value={form.brand} onChange={e => setForm(f => ({...f, brand: e.target.value}))} placeholder="e.g. Toyota, Honda, BYD" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Model <span className="text-destructive">*</span></Label>
                      <Input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} placeholder="e.g. Civic, Atto 3" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Preferred Year</Label>
                      <Input value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} placeholder="e.g. 2023 or newer" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Budget Range</Label>
                      <Input value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} placeholder="e.g. 50-60 Lacs" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Additional Features / Requirements</Label>
                      <Textarea 
                        value={form.additionalInfo} 
                        onChange={e => setForm(f => ({...f, additionalInfo: e.target.value}))} 
                        placeholder="Specific colors, mileage limit, imported/local, etc." 
                        className="resize-none min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label>Your Name <span className="text-destructive">*</span></Label>
                      <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="John Doe" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email Address <span className="text-destructive">*</span></Label>
                      <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="john@example.com" required />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Phone Number <span className="text-destructive">*</span></Label>
                      <Input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+92 300 0000000" required />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting Request...</>
                  ) : (
                    <><Send className="w-5 h-5 mr-2" /> Send Request</>
                  )}
                </Button>

              </form>
            </motion.div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}