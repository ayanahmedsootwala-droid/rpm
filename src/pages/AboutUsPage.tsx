import { PublicLayout } from '@/components/layouts/PublicLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Users, ShieldCheck, Trophy, Car } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { motion } from 'framer-motion';

export default function AboutUsPage() {
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const siteName = getSetting('site_name', 'XYZ Automobiles');

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen pb-20">
        {/* Hero Section */}
        <div className="relative pt-32 pb-20 overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-secondary/30 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-balance mb-6"
            >
              Driving the Future of Automotive Retail
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty"
            >
              At {siteName}, we are redefining how you discover, buy, and sell premium vehicles. Built on trust, transparency, and innovation.
            </motion.p>
          </div>
        </div>

        {/* Core Values */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We operate on a set of principles that ensure every customer gets the exceptional service they deserve.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border/50 rounded-2xl p-8"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trust & Transparency</h3>
              <p className="text-muted-foreground leading-relaxed">No hidden fees, no surprises. We provide comprehensive vehicle histories, clear pricing, and straightforward processes.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border/50 rounded-2xl p-8"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Quality</h3>
              <p className="text-muted-foreground leading-relaxed">Every vehicle in our inventory undergoes a rigorous inspection process to ensure it meets our strict quality standards.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border/50 rounded-2xl p-8"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Customer First</h3>
              <p className="text-muted-foreground leading-relaxed">Our dedicated support team and automotive experts are always here to help you make the right choice.</p>
            </motion.div>
          </div>
        </div>

        {/* Story Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-secondary/20 border border-border rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">The {siteName} Story</h2>
              <p className="text-muted-foreground leading-relaxed">
                Founded with a vision to streamline the car buying and selling experience, our journey began under the name <strong>Branded cars</strong>. In 2005, reflecting our rapid growth and expanding vision, we rebranded as <strong>RPM Motors</strong>, setting a new benchmark for automotive excellence. Today, we operate as {siteName}, continuing our legacy of innovation.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We recognized that the traditional automotive market was fragmented and often frustrating. By combining cutting-edge technology with industry expertise, we've created a seamless ecosystem for individual buyers, private sellers, and commercial dealerships to connect effortlessly.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1668639369890-09ce48dc3ca1?q=80&w=2071&auto=format&fit=crop" alt="Our Showroom" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
