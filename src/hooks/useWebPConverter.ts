/**
 * useWebPConverter — client-side canvas WebP conversion hook
 * Converts any image File/Blob to WebP via canvas.toBlob
 */

export interface WebPConverterOptions {
  quality?: number;   // 0-1, default 0.85
  maxWidth?: number;  // default 1920
  maxHeight?: number; // default 1920
}

/**
 * Convert a single File to WebP format using canvas.
 * Returns a new File with .webp extension and image/webp type.
 */
export async function convertToWebP(
  file: File,
  options: WebPConverterOptions = {}
): Promise<File> {
  const { quality = 0.85, maxWidth = 1920, maxHeight = 1920 } = options;

  // If already webp, return as-is
  if (file.type === 'image/webp') return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate dimensions
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('WebP conversion failed')); return; }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const webpFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert multiple files to WebP concurrently
 */
export async function convertAllToWebP(
  files: File[],
  options: WebPConverterOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(f => convertToWebP(f, options)));
}

/**
 * Hook-style wrapper for use in components.
 * Returns a convert function and tracks loading state.
 */
import { useState, useCallback } from 'react';

export function useWebPConverter(options: WebPConverterOptions = {}) {
  const [converting, setConverting] = useState(false);

  const convert = useCallback(async (file: File): Promise<File> => {
    setConverting(true);
    try {
      return await convertToWebP(file, options);
    } finally {
      setConverting(false);
    }
  }, [options]);

  const convertAll = useCallback(async (files: File[]): Promise<File[]> => {
    setConverting(true);
    try {
      return await convertAllToWebP(files, options);
    } finally {
      setConverting(false);
    }
  }, [options]);

  return { convert, convertAll, converting };
}
