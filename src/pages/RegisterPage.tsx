import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const { getSetting } = useSiteSettings();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const siteName = getSetting('site_name', 'XYZ Automobiles');
  const logoUrl = getSetting('site_logo_url', '');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please agree to the User Agreement and Privacy Policy'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await signUpWithEmail(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) { toast.error(error.message || 'Registration failed'); return; }
    toast.success('Account created! Welcome!');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Branding/Image */}
      <div className="hidden md:flex md:w-1/2 relative bg-zinc-950 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=2025&auto=format&fit=crop" 
            alt="Premium Cars" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>
        <div className="relative z-10 px-12 lg:px-20 text-white">
          <Link to="/" className="inline-flex items-center gap-3 mb-10 group">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain max-w-[140px] drop-shadow-md transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                <Car className="w-6 h-6 text-black" />
              </div>
            )}
            <span className="font-bold text-xl tracking-tight text-white">{siteName}</span>
          </Link>
          <h2 className="text-4xl lg:text-5xl font-bold leading-[1.1] mb-6 tracking-tight text-balance">
            Join the premier network of <span className="text-[hsl(var(--gold))]">automotive</span> enthusiasts.
          </h2>
          <p className="text-zinc-400 text-lg max-w-md leading-relaxed text-pretty">
            Create an account to start bidding, saving favorites, and managing your vehicle listings.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative bg-background">
        <Link to="/" className="absolute top-6 left-6 md:hidden inline-flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <span className="font-bold text-foreground">{siteName}</span>
        </Link>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Create account</h1>
            <p className="text-sm text-muted-foreground mt-2">Join {siteName}'s premier auto marketplace</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="John Doe" className="h-11 bg-secondary/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="h-11 bg-secondary/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input id="password" type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                  className="h-11 bg-secondary/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all pr-10" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-secondary/30 p-4 rounded-lg border border-border/50">
              <Checkbox id="terms" checked={agreed} onCheckedChange={v => setAgreed(!!v)} className="mt-0.5" />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link to="/privacy-policy" className="underline cursor-pointer hover:text-foreground transition-colors">User Agreement</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="underline cursor-pointer hover:text-foreground transition-colors">Privacy Policy</Link>
              </label>
            </div>
            <Button type="submit" className="w-full h-11 text-base font-medium shadow-sm transition-all hover:-translate-y-0.5" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground font-medium hover:underline hover:text-primary transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
