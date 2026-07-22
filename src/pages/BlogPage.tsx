import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Calendar, Tag, Clock, ArrowLeft, Share2, BookOpen, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { supabase } from '@/db/supabase';
import { formatDate } from '@/lib/utils-xyz';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { BlogPost } from '@/types/types';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Buying Guide', 'Comparisons', 'Tips & Advice', 'News & Updates', 'Finance & Insurance', 'Reviews'];

function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const img = post.featured_image || post.image_url;
  return (
    <Link to={`/blog/${post.slug}`} className={`group block ${featured ? 'md:col-span-2' : ''}`}>
      <div className="luxury-card overflow-hidden h-full flex flex-col card-3d">
        <div className={`relative overflow-hidden ${featured ? 'aspect-[2/1]' : 'aspect-[16/9]'}`}>
          {img ? (
            <img src={img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center"><BookOpen className="w-10 h-10 text-muted-foreground opacity-40" /></div>
          )}
          {post.is_featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gold text-gold-foreground text-xs">Featured</Badge>
            </div>
          )}
          {post.category && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">{post.category}</Badge>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className={`font-semibold leading-snug group-hover:text-gold transition-colors text-balance ${featured ? 'text-lg md:text-xl' : 'text-sm md:text-base'}`}>{post.title}</h3>
          {post.excerpt && <p className="text-muted-foreground text-sm mt-2 leading-relaxed line-clamp-2 text-pretty">{post.excerpt}</p>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.published_at || post.created_at)}</span>
            {post.tags && post.tags.length > 0 && (
              <span className="flex items-center gap-1 truncate"><Tag className="w-3 h-3 shrink-0" />{post.tags.slice(0, 2).join(', ')}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { getSetting } = useSiteSettings();
  const siteName = getSetting('site_name', 'XYZ Automobiles');

  useEffect(() => {
    setLoading(true);
    supabase.from('blog_posts').select('*').eq('is_published', true)
      .order('published_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setPosts(data as BlogPost[]); setLoading(false); });
  }, []);

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const featured = filtered.filter(p => p.is_featured).slice(0, 3);
  const rest = filtered.filter(p => !p.is_featured || featured.indexOf(p) === -1 || featured.length >= 3);

  return (
    <PublicLayout>
      <div className="pt-[68px] min-h-screen">
        {/* Hero */}
        <div className="section-bg-dark-premium py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <span className="section-label">{siteName} Blog</span>
            <h1 className="text-white text-3xl md:text-4xl font-bold mt-3 text-balance">Expert Insights & Car Reviews</h1>
            <p className="text-white/60 mt-3 text-sm max-w-md mx-auto">Buying guides, comparisons, financing tips, and the latest automotive news from Pakistan.</p>
            <div className="relative max-w-sm mx-auto mt-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles…"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 h-11" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-white/60" /></button>}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  category === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-gold/40 hover:text-foreground'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-video w-full rounded-xl bg-muted" />
                  <Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">{search ? `No articles matching "${search}"` : `No articles in "${category}"`}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(''); setCategory('All'); }}>Clear filters</Button>
            </div>
          ) : (
            <>
              {/* Featured row */}
              {featured.length > 0 && category === 'All' && !search && (
                <div className="mb-8">
                  <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-gold" />Featured Articles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {featured.map((p, i) => <BlogCard key={p.id} post={p} featured={i === 0} />)}
                  </div>
                </div>
              )}

              {/* All posts */}
              <div>
                {(featured.length > 0 && category === 'All' && !search) && (
                  <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-gold" />All Articles <span className="text-muted-foreground font-normal text-sm ml-1">({filtered.length})</span></h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {(category === 'All' && !search ? rest : filtered).map(p => <BlogCard key={p.id} post={p} />)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
      .then(({ data }) => {
        if (!data) { navigate('/blog'); return; }
        setPost(data as BlogPost);
        // load related
        supabase.from('blog_posts').select('*').eq('is_published', true).neq('slug', slug)
          .eq('category', data.category || '').limit(3).order('published_at', { ascending: false })
          .then(({ data: rel }) => setRelated((rel as BlogPost[]) || []));
        setLoading(false);
      });
  }, [slug, navigate]);

  if (loading) return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-24 space-y-4">
        <Skeleton className="h-8 w-3/4" /><Skeleton className="aspect-video w-full rounded-xl" />
        {Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-4 w-full"/>)}
      </div>
    </PublicLayout>
  );

  if (!post) return null;

  const img = post.featured_image || post.image_url;

  return (
    <PublicLayout>
      <div className="pt-[68px] min-h-screen">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">{t('home')}</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/blog" className="hover:text-foreground">{t('blog')}</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground truncate">{post.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
          {/* Meta */}
          <div className="mb-6">
            {post.category && <Badge variant="secondary" className="mb-3">{post.category}</Badge>}
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-balance leading-tight">{post.title}</h1>
            {post.excerpt && <p className="text-muted-foreground mt-3 text-base leading-relaxed">{post.excerpt}</p>}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(post.published_at || post.created_at)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />5 min read</span>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto">
                <Share2 className="w-3.5 h-3.5" />Share
              </button>
            </div>
          </div>

          {/* Hero image */}
          {img && (
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img src={img} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-gold prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content || post.excerpt || '' }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-8">
            <Link to="/blog"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />{t('backToBlog')}</Button></Link>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="section-bg-mesh-light py-10">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <h2 className="text-lg font-semibold mb-5">More in {post.category || 'Articles'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map(p => <BlogCard key={p.id} post={p} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export default function BlogPage() {
  const { t } = useLanguage();
  const { slug } = useParams<{ slug?: string }>();
  return slug ? <BlogDetailPage /> : <BlogListPage />;
}
