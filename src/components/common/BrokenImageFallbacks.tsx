import { useEffect } from 'react';
import { getLocalFallbackForImage } from '../../lib/imageFallbacks';

/**
 * Keeps remote/admin-uploaded images from becoming blank when their host is down.
 * This capture-phase listener works for plain <img> elements throughout lazy-loaded
 * routes, including images whose JSX does not provide its own onError handler.
 */
export function BrokenImageFallbacks() {
  useEffect(() => {
    const handleImageError = (event: Event) => {
      const target = event.target;

      if (!(target instanceof HTMLImageElement)) return;
      if (target.dataset.imageFallbackApplied === 'true') return;

      const source = target.currentSrc || target.src;
      if (!source || source.startsWith('data:')) return;

      target.dataset.imageFallbackApplied = 'true';
      target.src = getLocalFallbackForImage(source);
    };

    document.addEventListener('error', handleImageError, true);
    return () => document.removeEventListener('error', handleImageError, true);
  }, []);

  return null;
}
