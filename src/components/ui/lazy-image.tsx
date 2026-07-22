import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  placeholderColor?: string;
}

export default function LazyImage({ src, alt, className, wrapperClassName, placeholderColor = 'bg-muted', ...props }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('overflow-hidden', wrapperClassName)}>
      {!loaded && <div className={cn('w-full h-full skeleton-shimmer', placeholderColor)} />}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={cn('w-full h-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
          onLoad={() => setLoaded(true)}
          {...props}
        />
      )}
    </div>
  );
}
