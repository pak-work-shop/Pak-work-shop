import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';

export interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
  aspectRatioClass?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt = 'Before',
  afterAlt = 'After',
  aspectRatioClass = 'aspect-[16/10]',
  className = '',
}: BeforeAfterSliderProps) {
  const { t, i18n } = useTranslation();
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0..100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRtl = i18n.dir() === 'rtl';

  const updatePosition = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left;
      let percentage = (rawX / rect.width) * 100;
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      setSliderPosition(percentage);
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t('gallery.sliderAria', 'Before and After comparison slider. Use arrow keys to adjust.')}
      className={`relative select-none overflow-hidden rounded-xl bg-[#12151A] cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-[#FF6A00] ${aspectRatioClass} ${className}`}
    >
      {/* After Image (Background Base) */}
      <img
        src={afterImage}
        alt={afterAlt}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        loading="lazy"
      />

      {/* Before Image (Clipped Overlay) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
        }}
      >
        <img
          src={beforeImage}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      </div>

      {/* Badges */}
      <span className="absolute top-3 start-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider border border-white/20 pointer-events-none">
        {t('gallery.before', 'Before')}
      </span>
      <span className="absolute top-3 end-3 px-2 py-0.5 rounded bg-[#FF6A00]/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider border border-white/20 pointer-events-none">
        {t('gallery.after', 'After')}
      </span>

      {/* Slider Divider Line & Thumb */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1B1F26] border-2 border-white shadow-xl flex items-center justify-center text-white">
          <GripVertical className="w-4 h-4 text-[#FF6A00]" />
        </div>
      </div>
    </div>
  );
}
