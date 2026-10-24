import React from 'react';
import {
  Armchair,
  BatteryCharging,
  CircleDot,
  Cog,
  Disc3,
  Droplet,
  Filter,
  Package,
  Shield,
  Snowflake,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCategoryPhoto } from '../../lib/defaultImages';

export const CATEGORY_ICON_OPTIONS: ReadonlyArray<string> = [
  'Cog',
  'Droplet',
  'Filter',
  'Disc3',
  'Wrench',
  'Zap',
  'BatteryCharging',
  'CircleDot',
  'Snowflake',
  'Shield',
  'Sparkles',
  'Armchair',
  'Package',
];

export function CategoryIcon({
  name,
  iconName,
  slug,
  className,
}: {
  name?: string | null;
  iconName?: string | null;
  slug?: string | null;
  className?: string;
}) {
  const key = (name || iconName || slug || '').toLowerCase().trim();
  const baseClass = cn('w-5 h-5 shrink-0', className);

  if (key === 'cog' || key.includes('engine')) {
    return <Cog className={baseClass} />;
  }
  if (key === 'droplet' || key.includes('oil') || key.includes('lubricant')) {
    return <Droplet className={baseClass} />;
  }
  if (key === 'filter' || key.includes('filter')) {
    return <Filter className={baseClass} />;
  }
  if (key === 'disc3' || key.includes('brake')) {
    return <Disc3 className={baseClass} />;
  }
  if (key === 'wrench' || key.includes('suspension') || key.includes('steering')) {
    return <Wrench className={baseClass} />;
  }
  if (key === 'zap' || key.includes('electrical') || key.includes('light')) {
    return <Zap className={baseClass} />;
  }
  if (key === 'batterycharging' || key.includes('batter')) {
    return <BatteryCharging className={baseClass} />;
  }
  if (key === 'circledot' || key.includes('tyre') || key.includes('wheel')) {
    return <CircleDot className={baseClass} />;
  }
  if (key === 'snowflake' || key.includes('ac') || key.includes('cool')) {
    return <Snowflake className={baseClass} />;
  }
  if (key === 'shield' || key.includes('body') || key.includes('exterior')) {
    return <Shield className={baseClass} />;
  }
  if (
    key === 'sparkles' ||
    key === 'armchair' ||
    key.includes('interior') ||
    key.includes('care')
  ) {
    return <Sparkles className={baseClass} />;
  }
  return <Package className={baseClass} />;
}

export function CategoryIllustration({
  slug,
  categorySlug,
  iconName,
  title,
  sku,
  className,
}: {
  slug?: string | null;
  categorySlug?: string | null;
  iconName?: string | null;
  title?: string | null;
  sku?: string | null;
  className?: string;
}) {
  const [photoError, setPhotoError] = React.useState(false);
  const key = (slug || categorySlug || iconName || title || '').toLowerCase();
  const photoUrl = getCategoryPhoto(key);

  if (photoUrl && !photoError) {
    return (
      <div
        className={cn(
          'relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900 select-none',
          className
        )}
      >
        <img
          src={photoUrl}
          alt={title || key}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setPhotoError(true)}
          className="w-full h-full object-cover"
        />
        {sku && (
          <span className="absolute bottom-2 px-2 py-0.5 rounded bg-slate-950/85 border border-slate-700/80 text-[10px] font-mono tracking-wider text-slate-200 backdrop-blur-xs">
            {sku}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 select-none',
        className
      )}
      aria-hidden="true"
    >
      {/* Subtle architectural blueprint grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-15"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="paw-part-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#paw-part-grid)" />
      </svg>

      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-red-600/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Technical vector illustration per category */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
        {renderCategoryVector(key)}
        {sku && (
          <span className="mt-3 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-700/80 text-[10px] font-mono tracking-wider text-slate-300">
            {sku}
          </span>
        )}
      </div>
    </div>
  );
}

function renderCategoryVector(key: string) {
  // 1. Engine Parts
  if (key.includes('engine') || key === 'cog') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#334155"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        {/* Piston & Con-rod technical diagram */}
        <rect
          x="38"
          y="24"
          width="44"
          height="34"
          rx="4"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2.2"
        />
        <line x1="38" y1="32" x2="82" y2="32" stroke="#DC2626" strokeWidth="2" />
        <line x1="38" y1="38" x2="82" y2="38" stroke="#F59E0B" strokeWidth="1.8" />
        <circle
          cx="60"
          cy="46"
          r="6"
          fill="#0F172A"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        <path
          d="M55 52 L52 82 L68 82 L65 52 Z"
          fill="#334155"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
        <circle
          cx="60"
          cy="88"
          r="11"
          fill="#0F172A"
          stroke="#DC2626"
          strokeWidth="2.5"
        />
        <circle cx="60" cy="88" r="4" fill="#E2E8F0" />
      </svg>
    );
  }

  // 2. Oils & Lubricants
  if (key.includes('oil') || key.includes('lubricant') || key === 'droplet') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        {/* Canister + Golden Oil Drop */}
        <path
          d="M36 40 L68 40 L82 54 L82 94 C82 97 79 100 76 100 L36 100 C33 100 30 97 30 94 L30 46 C30 43 33 40 36 40 Z"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2.2"
        />
        <rect
          x="38"
          y="28"
          width="16"
          height="12"
          rx="2"
          fill="#DC2626"
          stroke="#FCA5A5"
          strokeWidth="1.5"
        />
        <path
          d="M66 46 L76 56 L72 62 L62 52 Z"
          fill="#0F172A"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />
        {/* Oil drop */}
        <path
          d="M56 56 C56 56 45 70 45 77 C45 83 50 88 56 88 C62 88 67 83 67 77 C67 70 56 56 56 56 Z"
          fill="#F59E0B"
          stroke="#FDE68A"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  // 3. Filters
  if (key.includes('filter')) {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <rect
          x="28"
          y="26"
          width="64"
          height="68"
          rx="6"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2.2"
        />
        <rect x="24" y="22" width="72" height="10" rx="3" fill="#DC2626" />
        <rect x="24" y="88" width="72" height="10" rx="3" fill="#334155" />
        {/* Pleats */}
        <line x1="38" y1="34" x2="38" y2="86" stroke="#94A3B8" strokeWidth="2" />
        <line x1="47" y1="34" x2="47" y2="86" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="56" y1="34" x2="56" y2="86" stroke="#94A3B8" strokeWidth="2" />
        <line x1="65" y1="34" x2="65" y2="86" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="74" y1="34" x2="74" y2="86" stroke="#94A3B8" strokeWidth="2" />
        <line x1="82" y1="34" x2="82" y2="86" stroke="#F59E0B" strokeWidth="1.5" />
      </svg>
    );
  }

  // 4. Brakes
  if (key.includes('brake') || key === 'disc3') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <circle
          cx="58"
          cy="60"
          r="38"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2.5"
        />
        <circle
          cx="58"
          cy="60"
          r="16"
          fill="#0F172A"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        {/* Rotor drill holes */}
        <circle cx="58" cy="32" r="2.5" fill="#94A3B8" />
        <circle cx="58" cy="88" r="2.5" fill="#94A3B8" />
        <circle cx="30" cy="60" r="2.5" fill="#94A3B8" />
        <circle cx="40" cy="40" r="2.5" fill="#94A3B8" />
        <circle cx="40" cy="80" r="2.5" fill="#94A3B8" />
        {/* Red brake caliper */}
        <path
          d="M72 30 C88 38 96 52 94 72 L78 70 C80 56 75 45 64 39 Z"
          fill="#DC2626"
          stroke="#FECACA"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  // 5. Suspension & Steering
  if (key.includes('suspension') || key.includes('steering') || key === 'wrench') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        {/* Coilover strut */}
        <line x1="60" y1="16" x2="60" y2="104" stroke="#CBD5E1" strokeWidth="4" />
        <rect
          x="46"
          y="16"
          width="28"
          height="10"
          rx="3"
          fill="#334155"
          stroke="#E2E8F0"
          strokeWidth="1.8"
        />
        {/* Coil spring */}
        <path
          d="M42 34 L78 42 L42 50 L78 58 L42 66 L78 74"
          fill="none"
          stroke="#DC2626"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="50"
          y="74"
          width="20"
          height="24"
          rx="3"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2"
        />
        <circle cx="60" cy="100" r="5" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
      </svg>
    );
  }

  // 6. Electrical & Lighting
  if (key.includes('electrical') || key.includes('light') || key === 'zap') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <circle
          cx="60"
          cy="60"
          r="38"
          fill="#1E293B"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <path
          d="M66 24 L38 64 L58 64 L52 96 L82 54 L62 54 Z"
          fill="#F59E0B"
          stroke="#FEF3C7"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // 7. Batteries
  if (key.includes('batter')) {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <rect
          x="24"
          y="38"
          width="72"
          height="54"
          rx="6"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2.2"
        />
        <rect x="34" y="28" width="12" height="10" rx="2" fill="#DC2626" />
        <rect x="74" y="28" width="12" height="10" rx="2" fill="#64748B" />
        {/* Plus and Minus */}
        <line x1="40" y1="54" x2="40" y2="66" stroke="#DC2626" strokeWidth="2.5" />
        <line x1="34" y1="60" x2="46" y2="60" stroke="#DC2626" strokeWidth="2.5" />
        <line x1="74" y1="60" x2="86" y2="60" stroke="#94A3B8" strokeWidth="2.5" />
        <path
          d="M63 50 L54 65 L61 65 L57 78 L68 62 L61 62 Z"
          fill="#F59E0B"
        />
      </svg>
    );
  }

  // 8. Tyres & Wheels
  if (key.includes('tyre') || key.includes('wheel') || key === 'circledot') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="#0F172A"
          stroke="#CBD5E1"
          strokeWidth="6"
          strokeDasharray="10 4"
        />
        <circle
          cx="60"
          cy="60"
          r="24"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2.2"
        />
        <circle cx="60" cy="60" r="7" fill="#DC2626" />
        <line x1="60" y1="36" x2="60" y2="53" stroke="#94A3B8" strokeWidth="2.5" />
        <line x1="60" y1="67" x2="60" y2="84" stroke="#94A3B8" strokeWidth="2.5" />
        <line x1="36" y1="60" x2="53" y2="60" stroke="#94A3B8" strokeWidth="2.5" />
        <line x1="67" y1="60" x2="84" y2="60" stroke="#94A3B8" strokeWidth="2.5" />
      </svg>
    );
  }

  // 9. AC & Cooling
  if (key.includes('ac') || key.includes('cool') || key === 'snowflake') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <line x1="60" y1="22" x2="60" y2="98" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <line x1="27" y1="41" x2="93" y2="79" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <line x1="27" y1="79" x2="93" y2="41" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="60" r="10" fill="#0F172A" stroke="#E0F2FE" strokeWidth="2.5" />
      </svg>
    );
  }

  // 10. Body & Exterior Accessories
  if (key.includes('body') || key.includes('exterior') || key === 'shield') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <path
          d="M60 22 L90 34 L90 60 C90 80 76 92 60 98 C44 92 30 80 30 60 L30 34 Z"
          fill="#1E293B"
          stroke="#E2E8F0"
          strokeWidth="2.2"
        />
        <path
          d="M60 32 L80 40 L80 58 C80 72 70 82 60 87"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2.2"
        />
      </svg>
    );
  }

  // 11. Interior & Car Care / Default
  return (
    <svg viewBox="0 0 120 120" className="w-24 h-24">
      <rect
        x="30"
        y="34"
        width="60"
        height="56"
        rx="8"
        fill="#1E293B"
        stroke="#E2E8F0"
        strokeWidth="2.2"
      />
      <path d="M30 52 L90 52" stroke="#DC2626" strokeWidth="2.2" />
      <circle cx="60" cy="70" r="10" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
    </svg>
  );
}
