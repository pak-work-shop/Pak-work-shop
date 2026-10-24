import React from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './router';
import { env } from '../lib/env';
import { ConfigRequiredPage } from '../components/common/ConfigRequiredPage';

function AppContent() {
  // Per §2 & §12.1: When VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing,
  // strictly render the full-screen "Configuration required" page listing the missing variables.
  if (!env.isConfigured) {
    return <ConfigRequiredPage missingVars={env.missingVars} />;
  }

  return <AppRouter />;
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
