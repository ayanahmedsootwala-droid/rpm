import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomableLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

export function ZoomableLightbox({ images, initialIndex = 0, onClose }: ZoomableLightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const total = images.length;

  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const goTo = useCallback((next: number) => {
    setIdx(((next % total) + total) % total);
    resetZoom();
  }, [total, resetZoom]);

  const zoomIn = () => setZoom(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(1)));
  const zoomOut = () => {
    setZoom(z => {
      const nz = Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(1));
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && total > 1) goTo(idx - 1);
      else if (e.key === 'ArrowRight' && total > 1) goTo(idx + 1);
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-') zoomOut();
      else if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [idx, total, goTo, onClose, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(1)));
    } else {
      setZoom(z => {
        const nz = Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(1));
        if (nz === 1) setPan({ x: 0, y: 0 });
        return nz;
      });
    }
  };

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = (e.clientX - dragStart.current.x) / zoom;
    const dy = (e.clientY - dragStart.current.y) / zoom;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  };
  const handleMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  // Touch events (pinch-to-zoom + swipe)
  const touchStart = useRef<{ dist?: number; startX?: number; startY?: number; panX?: number; panY?: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStart.current = { dist: Math.hypot(dx, dy) };
    } else if (e.touches.length === 1) {
      touchStart.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    if (e.touches.length === 2 && touchStart.current.dist != null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scale = newDist / touchStart.current.dist;
      setZoom(z => {
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z * scale).toFixed(2)));
        if (nz === 1) setPan({ x: 0, y: 0 });
        return nz;
      });
      touchStart.current = { dist: newDist };
    } else if (e.touches.length === 1 && zoom > 1 && touchStart.current.startX != null) {
      const dx = (e.touches[0].clientX - touchStart.current.startX) / zoom;
      const dy = (e.touches[0].clientY - (touchStart.current.startY ?? 0)) / zoom;
      setPan({ x: (touchStart.current.panX ?? 0) + dx, y: (touchStart.current.panY ?? 0) + dy });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && zoom <= 1 && touchStart.current?.startX != null) {
      const dx = e.changedTouches[0].clientX - (touchStart.current.startX ?? 0);
      if (Math.abs(dx) > 60) {
        goTo(dx < 0 ? idx + 1 : idx - 1);
      }
    }
    touchStart.current = null;
  };

  const zoomPct = Math.round(zoom * 100);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/97 flex flex-col"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="px-2.5 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-mono min-w-[52px]"
          >
            {zoomPct}%
          </button>
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoom > 1 && (
            <button
              onClick={resetZoom}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter */}
        <span className="text-white/40 text-sm tabular-nums">
          {idx + 1} / {total}
        </span>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center relative select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
        onClick={e => { if (!dragging && zoom <= 1) { /* allow click to do nothing */ } }}
      >
        <img
          ref={imgRef}
          src={images[idx]}
          alt={`Photo ${idx + 1}`}
          draggable={false}
          className="max-w-none transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            maxWidth: zoom === 1 ? '100%' : undefined,
            maxHeight: zoom === 1 ? '100%' : undefined,
            objectFit: 'contain',
          }}
          onClick={e => {
            e.stopPropagation();
            if (zoom === 1) setZoom(2);
          }}
        />

        {/* Hint */}
        {zoom === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 text-white/50 text-[11px] px-3 py-1 rounded-full pointer-events-none">
            <Maximize2 className="w-3 h-3" />
            Click or scroll to zoom · drag to pan
          </div>
        )}
      </div>

      {/* Nav arrows */}
      {total > 1 && (
        <>
          <button
            onClick={() => goTo(idx - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo(idx + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="shrink-0 pb-4 pt-2 px-4">
          <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all',
                  i === idx
                    ? 'border-white opacity-100 scale-110'
                    : 'border-white/20 opacity-40 hover:opacity-70 hover:scale-105'
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hint */}
      <div className="absolute bottom-3 right-4 text-white/25 text-[10px] hidden md:block pointer-events-none">
        ← → navigate · scroll zoom · Esc close
      </div>
    </div>
  );
}
