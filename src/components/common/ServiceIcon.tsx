import React from 'react';
import {
  Activity,
  BatteryCharging,
  CircleDot,
  ClipboardCheck,
  Cog,
  Crosshair,
  Disc3,
  Droplet,
  PaintBucket,
  Settings,
  Snowflake,
  Sparkles,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';

/**
 * Explicit allow-list of the 14 seeded service icons plus Wrench as fallback.
 * Never dynamically imports arbitrary icon strings.
 */
export const SERVICE_ICON_OPTIONS = [
  'Cog',
  'PaintBucket',
  'Snowflake',
  'Zap',
  'CircleDot',
  'Sparkles',
  'Disc3',
  'Activity',
  'Droplet',
  'BatteryCharging',
  'Crosshair',
  'Settings',
  'Wind',
  'ClipboardCheck',
  'Wrench',
] as const;

export type ServiceIconName = (typeof SERVICE_ICON_OPTIONS)[number];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cog,
  PaintBucket,
  Snowflake,
  Zap,
  CircleDot,
  Sparkles,
  Disc3,
  Activity,
  Droplet,
  BatteryCharging,
  Crosshair,
  Settings,
  Wind,
  ClipboardCheck,
  Wrench,
};

export interface ServiceIconProps {
  name?: string | null;
  className?: string;
}

export function ServiceIcon({ name, className = 'w-5 h-5' }: ServiceIconProps) {
  const IconComponent = (name && ICON_MAP[name]) || Wrench;
  return <IconComponent className={className} />;
}
