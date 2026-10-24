export interface EnvConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
  missingVars: string[];
  isConfigured: boolean;
}

export function getEnvConfig(): EnvConfig {
  const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
  const rawKey =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    '';

  const missingVars: string[] = [];

  if (!rawUrl) {
    missingVars.push('VITE_SUPABASE_URL');
  }
  if (!rawKey) {
    missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  return {
    supabaseUrl: rawUrl,
    supabasePublishableKey: rawKey,
    missingVars,
    isConfigured: missingVars.length === 0,
  };
}

export const env = getEnvConfig();
