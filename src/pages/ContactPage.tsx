import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle, Instagram, Facebook, Twitter, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const { getSetting } = useSiteSettings();

  const siteName    = getSetting('site_name',       'RPM MOTORS');
  const phone       = getSetting('contact_phone',   '+92 321 8284748');
  const phone2      = getSetting('contact_phone_2', '');
  const email       = getSetting('contact_email',   'info@rpmmotorskhi.com');
  const address     = getSetting('contact_address', 'Karachi, Pakistan');
  const whatsapp    = getSetting('contact_whatsapp', phone).replace(/[^0-9]/g, '');
  const tagline     = getSetting('site_tagline',    "Pakistan's premier luxury automotive marketplace.");
  const igUrl       = getSetting('social_instagram', '#');
  const fbUrl       = getSetting('social_facebook',  '#');
  const twUrl       = getSetting('social_twitter',   '#');

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error(t('required') + ': ' + t('name') + ', ' + t('email') + ', ' + t('message')); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: form.name, email: form.email, phone: form.phone || null,
        subject: form.subject, message: form.message, status: 'new',
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
    } catch {
      setSubmitted(true);
      toast.success('Message received! We\'ll be in touch shortly.');
    }
    setSubmitting(false);
  }

  // Build contact cards dynamically from settings
  const contactCards = [
    phone  && { icon: Phone,  label: 'Phone',   value: phone,  href: `tel:${phone}`,  sub: 'Mon–Sat, 9am–7pm' },
    phone2 && { icon: Phone,  label: 'Landline', value: phone2, href: `tel:${phone2}`, sub: 'Business hours' },
    email  && { icon: Mail,   label: 'Email',    value: email,  href: `mailto:${email}`, sub: 'Reply within 24 hrs' },
    address && { icon: MapPin, label: 'Address',  value: address, href: '#', sub: '' },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; href: string; sub: string }[];

  return (
    <PublicLayout>
      <div className="pt-[68px] min-h-screen">
        {/* Hero */}
        <div className="section-bg-dark-premium py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-gold" />
              <span className="section-label">{t('getInTouch')}</span>
            </div>
            <h1 className="text-white text-3xl md:text-4xl font-bold text-balance">{t('contactSubtitle') || "We'd Love to Hear From You"}</h1>
            <p className="text-white/60 mt-3 text-sm max-w-md mx-auto">Whether you're buying, selling, or just have a question — our team is here to help.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground">{t('home')}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t('contact')}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Contact info column */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">{siteName}</h2>
                <p className="text-sm text-muted-foreground">{tagline}</p>
              </div>

              <div className="space-y-4">
                {contactCards.map(({ icon: Icon, label, value, href, sub }) => (
                  <a key={label} href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-gold/30 hover:bg-secondary/50 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium mt-0.5 group-hover:text-gold transition-colors">{value}</p>
                      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                  </a>
                ))}
              </div>

              <div className="p-4 border border-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium"><Clock className="w-4 h-4 text-gold" />{t('businessHours')}</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Monday – Friday</span><span className="font-medium text-foreground">9:00am – 7:00pm</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span className="font-medium text-foreground">10:00am – 5:00pm</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="text-muted-foreground">Closed</span></div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="whatsapp-btn w-full justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chat on WhatsApp
                </a>
              )}

              {/* Social */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">{t('followUs')}</p>
                <div className="flex items-center gap-3">
                  {([
                    { icon: Instagram, href: igUrl, label: 'Instagram' },
                    { icon: Facebook,  href: fbUrl, label: 'Facebook'  },
                    { icon: Twitter,   href: twUrl, label: 'Twitter'   },
                  ] as const).map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors">
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Message Sent!</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Thank you for reaching out. Our team will get back to you within 24 business hours.</p>
                    <div className="flex gap-3 justify-center mt-6">
                      <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: 'general', message: '' }); }}>{t('send')} {t('message')}</Button>
                      <Link to="/"><Button>{t('backToHome')}</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader><CardTitle className="text-base">{t('getInTouch')}</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>{t('name')} <span className="text-destructive">*</span></Label>
                          <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ahmed Ali" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('email')} <span className="text-destructive">*</span></Label>
                          <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="ahmed@gmail.com" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>{t('phone')}</Label>
                          <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('subject')}</Label>
                          <Select value={form.subject} onValueChange={v => update('subject', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General Inquiry</SelectItem>
                              <SelectItem value="buying">Buying a Car</SelectItem>
                              <SelectItem value="selling">Selling a Car</SelectItem>
                              <SelectItem value="auction">Auction Support</SelectItem>
                              <SelectItem value="dealership">Dealership Partnership</SelectItem>
                              <SelectItem value="complaint">Complaint</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('message')} <span className="text-destructive">*</span></Label>
                        <Textarea value={form.message} onChange={e => update('message', e.target.value)}
                          placeholder="Tell us how we can help you…" rows={6} required />
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg text-xs text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        We typically respond within 24 business hours. For urgent queries, please call us directly or use WhatsApp.
                      </div>
                      <Button type="submit" disabled={submitting} className="w-full h-11">
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('sending')}</> : <><Send className="w-4 h-4 mr-2" />{t('send')} {t('message')}</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
