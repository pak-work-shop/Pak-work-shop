import React from 'react';
import { cn } from '../../lib/utils';

export type WorkshopIllustrationVariant =
  | 'hero-workshop'
  | 'about-workshop'
  | 'cta-banner'
  | 'periodic-maintenance'
  | 'computerized-diagnostics'
  | 'engine-repair'
  | 'brake-service'
  | 'suspension-steering'
  | 'ac-heating-service'
  | 'electrical-battery'
  | 'wheel-alignment-balancing'
  | 'transmission-clutch'
  | 'denting-painting'
  | 'detailing-cleaning'
  | 'pre-purchase-inspection'
  | 'hybrid-ev-care'
  | 'roadside-pickup'
  | 'tyres'
  | 'exhaust'
  | 'generic-service';

const SLUG_TO_ILLUSTRATION_VARIANT: Readonly<Record<string, WorkshopIllustrationVariant>> = {
  // Phase 2 seeded service slugs (14 services)
  'engine': 'engine-repair',
  'denting-painting': 'denting-painting',
  'ac-repair': 'ac-heating-service',
  'electrical': 'computerized-diagnostics',
  'tyres': 'tyres',
  'car-wash-detailing': 'detailing-cleaning',
  'brakes': 'brake-service',
  'suspension-steering': 'suspension-steering',
  'oil-change-service': 'periodic-maintenance',
  'battery': 'electrical-battery',
  'wheel-alignment-balancing': 'wheel-alignment-balancing',
  'transmission-gearbox': 'transmission-clutch',
  'exhaust': 'exhaust',
  'general-inspection': 'pre-purchase-inspection',
  // Alternate / alias slugs
  'periodic-maintenance': 'periodic-maintenance',
  'computerized-diagnostics': 'computerized-diagnostics',
  'engine-repair': 'engine-repair',
  'brake-service': 'brake-service',
  'ac-heating-service': 'ac-heating-service',
  'electrical-battery': 'electrical-battery',
  'transmission-clutch': 'transmission-clutch',
  'detailing-cleaning': 'detailing-cleaning',
  'pre-purchase-inspection': 'pre-purchase-inspection',
  'hybrid-ev-care': 'hybrid-ev-care',
  'roadside-pickup': 'roadside-pickup',
};

export const KNOWN_SERVICE_ILLUSTRATION_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(SLUG_TO_ILLUSTRATION_VARIANT)
);

export function resolveServiceIllustrationVariant(
  slug?: string | null
): WorkshopIllustrationVariant {
  const clean = (slug ?? '').trim().toLowerCase();
  return SLUG_TO_ILLUSTRATION_VARIANT[clean] ?? 'generic-service';
}

export interface WorkshopIllustrationProps {
  variant?: WorkshopIllustrationVariant;
  serviceSlug?: string | null;
  title?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  className?: string;
}

const ratioMap = {
  video: 'aspect-video',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
};

/**
 * Custom dark-industrial + safety-orange SVG illustrations for all 14 workshop
 * services, hero/about sections, and generic fallback.
 * Used when an admin has not uploaded a custom `image_url`.
 */
export function WorkshopIllustration({
  variant,
  serviceSlug,
  title,
  aspectRatio = 'video',
  className,
}: WorkshopIllustrationProps) {
  const resolvedVariant: WorkshopIllustrationVariant =
    variant ?? resolveServiceIllustrationVariant(serviceSlug);

  return (
    <div
      role="img"
      aria-label={title || resolvedVariant}
      className={cn(
        'relative overflow-hidden rounded-lg bg-[#0E1013] border border-white/15 select-none',
        ratioMap[aspectRatio],
        className
      )}
    >
      <svg
        viewBox="0 0 640 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0E1013" />
            <stop offset="55%" stopColor="#161A21" />
            <stop offset="100%" stopColor="#1B1F26" />
          </linearGradient>
          <radialGradient id="orangeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FF6A00" stopOpacity="0" />
          </radialGradient>
          <pattern id="techGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Industrial background + grid + glow */}
        <rect width="640" height="360" fill="url(#bgGrad)" />
        <rect width="640" height="360" fill="url(#techGrid)" />
        <circle cx="320" cy="180" r="170" fill="url(#orangeGlow)" />

        {/* Corner HUD brackets */}
        <path d="M24 44 V24 H44" stroke="#FF6A00" strokeWidth="2" strokeOpacity="0.6" />
        <path d="M616 44 V24 H596" stroke="#FF6A00" strokeWidth="2" strokeOpacity="0.6" />
        <path d="M24 316 V336 H44" stroke="#FF6A00" strokeWidth="2" strokeOpacity="0.6" />
        <path d="M616 316 V336 H596" stroke="#FF6A00" strokeWidth="2" strokeOpacity="0.6" />

        {renderVariantArtwork(resolvedVariant)}
      </svg>
    </div>
  );
}

function renderVariantArtwork(variant: WorkshopIllustrationVariant): React.ReactNode {
  switch (variant) {
    case 'hero-workshop':
      return (
        <g>
          {/* Hydraulic 2-post lift */}
          <rect x="140" y="70" width="22" height="220" rx="3" fill="#2A2F38" stroke="#FF6A00" strokeWidth="2" />
          <rect x="478" y="70" width="22" height="220" rx="3" fill="#2A2F38" stroke="#FF6A00" strokeWidth="2" />
          <rect x="120" y="286" width="400" height="10" rx="3" fill="#FF6A00" />
          <rect x="162" y="198" width="316" height="10" rx="3" fill="#FFC21A" />
          {/* Vehicle silhouette on lift */}
          <path
            d="M195 195 L220 148 H395 L430 195 Z"
            fill="#1B1F26"
            stroke="#F5F6F8"
            strokeWidth="3"
          />
          <rect x="175" y="182" width="285" height="32" rx="10" fill="#232832" stroke="#FF6A00" strokeWidth="2.5" />
          <circle cx="225" cy="216" r="22" fill="#0E1013" stroke="#FFC21A" strokeWidth="4" />
          <circle cx="405" cy="216" r="22" fill="#0E1013" stroke="#FFC21A" strokeWidth="4" />
          {/* Diagnostic telemetry wave */}
          <path
            d="M210 105 H265 L280 82 L298 125 L315 95 L330 112 H430"
            stroke="#FF6A00"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );

    case 'about-workshop':
      return (
        <g>
          {/* Multi-bay workshop building */}
          <rect x="130" y="95" width="380" height="195" rx="6" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="2.5" />
          <path d="M115 98 L320 52 L525 98 Z" fill="#232832" stroke="#FF6A00" strokeWidth="2.5" />
          {/* 3 service bays */}
          <rect x="160" y="155" width="90" height="135" rx="4" fill="#0E1013" stroke="#FF6A00" strokeWidth="2" />
          <rect x="275" y="155" width="90" height="135" rx="4" fill="#0E1013" stroke="#FFC21A" strokeWidth="2" />
          <rect x="390" y="155" width="90" height="135" rx="4" fill="#0E1013" stroke="#FF6A00" strokeWidth="2" />
          {/* Signboard */}
          <rect x="215" y="112" width="210" height="26" rx="4" fill="#FF6A00" />
          <line x1="240" y1="125" x2="400" y2="125" stroke="#0E1013" strokeWidth="4" strokeLinecap="round" />
        </g>
      );

    case 'cta-banner':
      return (
        <g>
          <circle cx="320" cy="180" r="95" stroke="#FF6A00" strokeWidth="3" strokeDasharray="10 8" />
          <path d="M260 195 L300 230 L385 140" stroke="#FFC21A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );

    case 'periodic-maintenance':
      return (
        <g>
          {/* Oil canister + synthetic drop + filter */}
          <path
            d="M210 130 H325 L365 170 V260 C365 270 357 278 347 278 H210 C200 278 192 270 192 260 V148 C192 138 200 130 210 130 Z"
            fill="#1B1F26"
            stroke="#FF6A00"
            strokeWidth="3"
          />
          <rect x="215" y="102" width="48" height="28" rx="4" fill="#FFC21A" />
          {/* Oil droplet on canister */}
          <path
            d="M278 168 C278 168 304 202 304 220 C304 234 292 246 278 246 C264 246 252 234 252 220 C252 202 278 168 278 168 Z"
            fill="#FFC21A"
          />
          {/* Spin-on Oil Filter cylinder */}
          <rect x="395" y="145" width="75" height="125" rx="10" fill="#232832" stroke="#F5F6F8" strokeWidth="2.5" />
          <line x1="395" y1="175" x2="470" y2="175" stroke="#FF6A00" strokeWidth="3" />
          <line x1="395" y1="240" x2="470" y2="240" stroke="#FF6A00" strokeWidth="3" />
        </g>
      );

    case 'computerized-diagnostics':
      return (
        <g>
          {/* Rugged OBD-II Scanner Tablet */}
          <rect x="175" y="88" width="290" height="184" rx="16" fill="#1B1F26" stroke="#FF6A00" strokeWidth="3.5" />
          <rect x="198" y="110" width="244" height="140" rx="6" fill="#0E1013" stroke="#2A2F38" strokeWidth="2" />
          {/* Live ECU Oscilloscope Waveform */}
          <path
            d="M212 185 H250 L266 142 L286 220 L306 155 L324 195 L342 170 H426"
            stroke="#FFC21A"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="415" cy="132" r="8" fill="#22C55E" />
          <rect x="214" y="126" width="90" height="10" rx="3" fill="#FF6A00" />
        </g>
      );

    case 'engine-repair':
      return (
        <g>
          {/* Engine block & twin pistons */}
          <rect x="190" y="135" width="260" height="145" rx="12" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="3" />
          <rect x="215" y="95" width="210" height="40" rx="6" fill="#232832" stroke="#FF6A00" strokeWidth="3" />
          {/* 4 cylinder bores / pistons */}
          {[225, 275, 325, 375].map((x) => (
            <g key={x}>
              <rect x={x} y="152" width="36" height="48" rx="4" fill="#0E1013" stroke="#FFC21A" strokeWidth="2" />
              <line x1={x + 18} y1="200" x2={x + 18} y2="245" stroke="#FF6A00" strokeWidth="4" />
              <circle cx={x + 18} cy="248" r="9" fill="#232832" stroke="#F5F6F8" strokeWidth="2" />
            </g>
          ))}
        </g>
      );

    case 'brake-service':
      return (
        <g>
          {/* Ventilated Brake Disc Rotor */}
          <circle cx="310" cy="180" r="102" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="4" />
          <circle cx="310" cy="180" r="46" fill="#0E1013" stroke="#8A93A3" strokeWidth="3" />
          <circle cx="310" cy="180" r="18" fill="#232832" />
          {/* Cross-drilled rotor slots */}
          <circle cx="310" cy="108" r="5" fill="#FFC21A" />
          <circle cx="310" cy="252" r="5" fill="#FFC21A" />
          <circle cx="238" cy="180" r="5" fill="#FFC21A" />
          <circle cx="382" cy="180" r="5" fill="#FFC21A" />
          {/* Performance Orange Brake Caliper */}
          <path
            d="M365 102 C410 120 432 162 424 215 L378 205 C384 168 370 140 342 126 Z"
            fill="#FF6A00"
            stroke="#F5F6F8"
            strokeWidth="2.5"
          />
        </g>
      );

    case 'suspension-steering':
      return (
        <g>
          {/* Coilover Shock Absorber Strut */}
          <rect x="296" y="68" width="48" height="42" rx="6" fill="#232832" stroke="#F5F6F8" strokeWidth="2.5" />
          <rect x="308" y="110" width="24" height="150" rx="4" fill="#1B1F26" stroke="#8A93A3" strokeWidth="2" />
          {/* Heavy orange coil spring */}
          {[122, 146, 170, 194, 218].map((y) => (
            <path
              key={y}
              d={`M272 ${y} L368 ${y + 12}`}
              stroke="#FF6A00"
              strokeWidth="10"
              strokeLinecap="round"
            />
          ))}
          <rect x="292" y="252" width="56" height="44" rx="8" fill="#232832" stroke="#FFC21A" strokeWidth="2.5" />
        </g>
      );

    case 'ac-heating-service':
      return (
        <g>
          {/* A/C Snowflake + Twin Manifold Pressure Gauges */}
          <circle cx="250" cy="180" r="76" fill="#1B1F26" stroke="#38BDF8" strokeWidth="3.5" />
          <line x1="250" y1="124" x2="250" y2="236" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
          <line x1="202" y1="152" x2="298" y2="208" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
          <line x1="298" y1="152" x2="202" y2="208" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
          {/* High/Low pressure gauge */}
          <circle cx="415" cy="155" r="46" fill="#0E1013" stroke="#FF6A00" strokeWidth="3.5" />
          <line x1="415" y1="155" x2="438" y2="132" stroke="#FFC21A" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="385" y="218" width="60" height="36" rx="6" fill="#232832" stroke="#F5F6F8" strokeWidth="2" />
        </g>
      );

    case 'electrical-battery':
      return (
        <g>
          {/* 12V Automotive Battery */}
          <rect x="185" y="128" width="270" height="150" rx="12" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="3" />
          <rect x="175" y="114" width="290" height="22" rx="6" fill="#232832" stroke="#FF6A00" strokeWidth="2.5" />
          {/* Terminals */}
          <rect x="215" y="92" width="32" height="22" rx="4" fill="#EF4444" />
          <rect x="393" y="92" width="32" height="22" rx="4" fill="#3B82F6" />
          {/* Lightning bolt */}
          <path
            d="M332 152 L292 204 H326 L310 252 L356 196 H322 L332 152 Z"
            fill="#FFC21A"
          />
        </g>
      );

    case 'wheel-alignment-balancing':
      return (
        <g>
          {/* Alloy Wheel + Laser Alignment Target Crosshair */}
          <circle cx="320" cy="180" r="96" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="4" />
          <circle cx="320" cy="180" r="64" fill="#0E1013" stroke="#FF6A00" strokeWidth="3" strokeDasharray="8 6" />
          <circle cx="320" cy="180" r="20" fill="#FFC21A" />
          {/* Laser crosshair lines */}
          <line x1="170" y1="180" x2="470" y2="180" stroke="#FF6A00" strokeWidth="2.5" strokeDasharray="6 6" />
          <line x1="320" y1="50" x2="320" y2="310" stroke="#FF6A00" strokeWidth="2.5" strokeDasharray="6 6" />
        </g>
      );

    case 'transmission-clutch':
      return (
        <g>
          {/* Interlocking Gearbox Gears & Clutch Plate */}
          <circle cx="265" cy="175" r="68" fill="#1B1F26" stroke="#FF6A00" strokeWidth="6" strokeDasharray="16 10" />
          <circle cx="265" cy="175" r="28" fill="#0E1013" stroke="#F5F6F8" strokeWidth="3" />
          <circle cx="395" cy="205" r="48" fill="#1B1F26" stroke="#FFC21A" strokeWidth="6" strokeDasharray="14 8" />
          <circle cx="395" cy="205" r="18" fill="#0E1013" stroke="#F5F6F8" strokeWidth="3" />
        </g>
      );

    case 'denting-painting':
      return (
        <g>
          {/* HVLP Spray Gun + Paint Mist Cone + Body Panel */}
          <path d="M205 155 H295 V185 H255 L235 255 H198 L215 185 H205 Z" fill="#232832" stroke="#F5F6F8" strokeWidth="3" />
          <rect x="225" y="95" width="52" height="58" rx="8" fill="#1B1F26" stroke="#FFC21A" strokeWidth="2.5" />
          {/* Spray fan */}
          <path d="M300 170 L435 115 V225 Z" fill="#FF6A00" fillOpacity="0.28" stroke="#FF6A00" strokeWidth="2" strokeDasharray="6 4" />
          <path d="M445 100 C465 140 465 220 445 260" stroke="#FFC21A" strokeWidth="5" strokeLinecap="round" />
        </g>
      );

    case 'detailing-cleaning':
      return (
        <g>
          {/* Ceramic Shield + Rotary Polisher Pad + Sparkles */}
          <path
            d="M320 82 L415 118 V182 C415 236 374 274 320 294 C266 274 225 236 225 182 V118 L320 82 Z"
            fill="#1B1F26"
            stroke="#FF6A00"
            strokeWidth="3.5"
          />
          {/* Sparkle stars */}
          <path d="M320 132 L328 158 L354 166 L328 174 L320 200 L312 174 L286 166 L312 158 Z" fill="#FFC21A" />
          <circle cx="368" cy="215" r="6" fill="#F5F6F8" />
          <circle cx="272" cy="215" r="6" fill="#F5F6F8" />
        </g>
      );

    case 'pre-purchase-inspection':
      return (
        <g>
          {/* Inspection Clipboard + Magnifying Loupe */}
          <rect x="215" y="78" width="180" height="210" rx="10" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="3" />
          <rect x="265" y="66" width="80" height="24" rx="6" fill="#FF6A00" />
          {[125, 165, 205, 245].map((y) => (
            <g key={y}>
              <circle cx="250" cy={y} r="8" fill="#22C55E" />
              <line x1="272" y1={y} x2="365" y2={y} stroke="#F5F6F8" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="405" cy="215" r="42" fill="#0E1013" stroke="#FFC21A" strokeWidth="4" />
          <line x1="436" y1="246" x2="468" y2="278" stroke="#FFC21A" strokeWidth="6" strokeLinecap="round" />
        </g>
      );

    case 'hybrid-ev-care':
      return (
        <g>
          {/* High-Voltage Hybrid Battery Module Pack + EV Leaf/Bolt */}
          <rect x="175" y="115" width="290" height="140" rx="12" fill="#1B1F26" stroke="#22C55E" strokeWidth="3.5" />
          {[205, 245, 285, 325, 365, 405].map((x) => (
            <rect key={x} x={x} y="138" width="26" height="94" rx="4" fill="#0E1013" stroke="#FF6A00" strokeWidth="2" />
          ))}
          <circle cx="320" cy="185" r="34" fill="#0E1013" stroke="#FFC21A" strokeWidth="3" />
          <path d="M326 162 L306 188 H324 L314 210 L338 182 H320 Z" fill="#FFC21A" />
        </g>
      );

    case 'roadside-pickup':
      return (
        <g>
          {/* Flatbed Recovery Carrier + GPS Pin */}
          <rect x="145" y="198" width="235" height="22" rx="4" fill="#FF6A00" />
          <path d="M380 148 H445 L472 182 V220 H380 Z" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="3" />
          <circle cx="205" cy="232" r="22" fill="#0E1013" stroke="#FFC21A" strokeWidth="4" />
          <circle cx="425" cy="232" r="22" fill="#0E1013" stroke="#FFC21A" strokeWidth="4" />
          {/* Car on flatbed */}
          <path d="M175 196 L198 158 H315 L342 196 Z" fill="#232832" stroke="#FFC21A" strokeWidth="2.5" />
          {/* Location Pin */}
          <path
            d="M260 72 C240 72 224 88 224 108 C224 132 260 154 260 154 C260 154 296 132 296 108 C296 88 280 72 260 72 Z"
            fill="#FF6A00"
          />
          <circle cx="260" cy="106" r="10" fill="#0E1013" />
        </g>
      );

    case 'tyres':
      return (
        <g>
          {/* Radial Tyre with Tread Blocks + Pressure Gauge */}
          <circle cx="290" cy="180" r="98" fill="#1B1F26" stroke="#FF6A00" strokeWidth="8" strokeDasharray="18 8" />
          <circle cx="290" cy="180" r="62" fill="#0E1013" stroke="#F5F6F8" strokeWidth="3.5" />
          <circle cx="290" cy="180" r="22" fill="#232832" stroke="#FFC21A" strokeWidth="3" />
          {/* Digital Tyre Pressure Gauge */}
          <circle cx="430" cy="145" r="40" fill="#0E1013" stroke="#FFC21A" strokeWidth="3.5" />
          <line x1="430" y1="145" x2="450" y2="126" stroke="#FF6A00" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M388 180 C395 215 415 232 430 245" stroke="#F5F6F8" strokeWidth="3" strokeLinecap="round" />
        </g>
      );

    case 'exhaust':
      return (
        <g>
          {/* Stainless Muffler + Catalytic Chamber + Dual Tailpipes */}
          <line x1="145" y1="180" x2="215" y2="180" stroke="#8A93A3" strokeWidth="14" strokeLinecap="round" />
          <rect x="215" y="132" width="185" height="96" rx="26" fill="#1B1F26" stroke="#F5F6F8" strokeWidth="3.5" />
          {/* Internal perforated acoustic baffle lines */}
          <line x1="255" y1="154" x2="360" y2="154" stroke="#FF6A00" strokeWidth="3" strokeDasharray="8 8" />
          <line x1="255" y1="180" x2="360" y2="180" stroke="#FFC21A" strokeWidth="3" strokeDasharray="8 8" />
          <line x1="255" y1="206" x2="360" y2="206" stroke="#FF6A00" strokeWidth="3" strokeDasharray="8 8" />
          {/* Dual chrome tailpipes */}
          <rect x="400" y="152" width="75" height="20" rx="6" fill="#232832" stroke="#FFC21A" strokeWidth="2.5" />
          <rect x="400" y="188" width="75" height="20" rx="6" fill="#232832" stroke="#FFC21A" strokeWidth="2.5" />
        </g>
      );

    case 'generic-service':
    default:
      return (
        <g>
          <circle cx="320" cy="180" r="82" fill="#1B1F26" stroke="#FF6A00" strokeWidth="3.5" />
          <path
            d="M285 215 L345 155 M335 140 C350 135 368 145 365 165 L305 225 C285 228 275 210 280 195 Z"
            stroke="#FFC21A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
  }
}
