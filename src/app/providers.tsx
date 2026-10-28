import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { BrokenImageFallbacks } from '../components/common/BrokenImageFallbacks';
import { SiteSettingsProvider } from '../features/settings/SiteSettingsContext';
import { AuthProvider } from '../features/auth/AuthContext';
import { VehicleFilterProvider } from '../features/catalogue/VehicleFilterContext';
import { CartProvider } from '../features/cart/CartContext';
import { ChatbotProvider } from '../features/chatbot/ChatbotContext';
import '../i18n';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <VehicleFilterProvider>
              <CartProvider>
                <ChatbotProvider>
                  <BrokenImageFallbacks />
                  {children}
                  <Toaster
                    position="top-center"
                    richColors
                    closeButton
                    toastOptions={{
                      style: {
                        background: '#1B1F26',
                        color: '#F5F6F8',
                        border: '1px solid rgba(255,255,255,0.15)',
                      },
                    }}
                  />
                </ChatbotProvider>
              </CartProvider>
            </VehicleFilterProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
