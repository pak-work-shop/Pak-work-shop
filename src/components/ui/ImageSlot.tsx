import React from 'react';
import { Image as ImageIcon, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ImageSlotProps {
  label: string;
  subtext?: string;
  src?: string | null;
  alt?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  className?: string;
}

const ratioMap = {
  video: 'aspect-video',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
};

/**
 * Neutral dark placeholder slot for owner-supplied images (Ground Rule #4).
 * Never fetches random external images. Renders the image if `src` is provided,
 * or a clean industrial SVG/box placeholder with label.
 */
export function ImageSlot({
  label,
  subtext,
  src,
  alt,
  aspectRatio = 'video',
  className,
}: ImageSlotProps) {
  if (src && src.trim().length > 0) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-white/15 bg-[#1B1F26]',
          ratioMap[aspectRatio],
          className
        )}
      >
        <img
          src={src}
          alt={alt || label}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative overflow-hidden rounded-lg border border-white/15 bg-[#1B1F26] flex flex-col items-center justify-center p-6 text-center select-none',
        ratioMap[aspectRatio],
        className
      )}
    >
      {/* Subtle SVG Gear & Grid Motif */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-between px-8">
        <Settings className="w-32 h-32 text-[#FF6A00] -ms-10" strokeWidth={1} />
        <Settings className="w-24 h-24 text-[#FFC21A] -me-8" strokeWidth={1} />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm">
        <div className="w-14 h-14 rounded-lg bg-[#2A2F38] border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] mb-3 shadow-inner">
          <ImageIcon className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-[#F5F6F8] mb-1">{label}</p>
        {subtext && <p className="text-xs text-[#8A93A3]">{subtext}</p>}
      </div>
    </div>
  );
}
