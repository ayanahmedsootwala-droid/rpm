import { Link } from 'react-router-dom';
import { Car, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export function Footer() {
  const { getSetting } = useSiteSettings();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const siteName = getSetting('site_name', 'XYZ Automobiles');
  const footerDesc = getSetting('site_tagline', "Pakistan's premier luxury automotive marketplace.");
  const logoUrl = getSetting('site_logo_url', '');
  const phone = getSetting('contact_phone', '+92 300 1234567');
  const contactEmail = getSetting('contact_email', 'info@xyzautos.com');
  const address = getSetting('contact_address', 'Karachi, Pakistan');
  const fbUrl = getSetting('social_facebook', '#');
  const igUrl = getSetting('social_instagram', '#');
  const twUrl = getSetting('social_twitter', '#');
  const ytUrl = getSetting('social_youtube', '#');
  const footerText = getSetting('footer_text', `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`);
  const auctionsOn = getSetting('auctions_feature_enabled', 'true') !== 'false';

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribing(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim() });
    setSubscribing(false);
    if (error) {
      if (error.code === '23505') toast.error('You are already subscribed!');
      else toast.error('Failed to subscribe. Please try again.');
    } else {
      toast.success('Subscribed successfully!');
      setEmail('');
    }
  };

  const quickLinks = [
    { label: t('home'), href: '/' },
    { label: t('inventory'), href: '/inventory' },
    ...(auctionsOn ? [{ label: t('auctions'), href: '/auctions' }] : []),
    { label: t('sellYourCar'), href: '/sell' },
    { label: t('blog'), href: '/blog' },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName}
                  className="h-9 w-auto object-contain max-w-[120px] opacity-90 transition-opacity group-hover:opacity-100 shrink-0" />
              ) : (
                <div className="w-9 h-9 bg-primary-foreground rounded-md flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-primary" />
                </div>
              )}
              <span className="font-semibold tracking-[-0.01em] text-lg text-primary-foreground leading-tight">{siteName}</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">{footerDesc}</p>
            <div className="flex gap-3">
              {([
                { key: 'facebook',  href: fbUrl, Icon: Facebook },
                { key: 'instagram', href: igUrl, Icon: Instagram },
                { key: 'twitter',   href: twUrl, Icon: Twitter },
                { key: 'youtube',   href: ytUrl, Icon: Youtube },
              ] as const).map(({ key, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-sm border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4 tracking-wide">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-4 tracking-wide">{t('contactUs')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-primary-foreground transition-colors">{phone}</a>
              </li>
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <a href={`mailto:${contactEmail}`} className="hover:text-primary-foreground transition-colors break-all">{contactEmail}</a>
              </li>
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
              <li>
                <Link to="/contact" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors mt-1">
                  <MessageSquare className="w-4 h-4 shrink-0" />Send us a Message
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-sm mb-2 tracking-wide">{t('newsletter')}</h3>
            <p className="text-primary-foreground/70 text-sm mb-4">{t('newsletterSubtitle')}</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-sm h-9"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="border border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/10 shrink-0 h-9 px-3"
              >
                {subscribing ? '...' : t('subscribe')}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/50 text-xs">{footerText}</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-primary-foreground/50 hover:text-primary-foreground/80 text-xs transition-colors">
              {t('privacy_policy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
