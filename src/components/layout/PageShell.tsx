import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingWhatsApp } from './FloatingWhatsApp';
import { ChatWidget } from '../../features/chatbot/ChatWidget';
import { CartDrawer } from '../../features/cart/CartDrawer';

export function PageShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0E1013] text-[#F5F6F8]">
      <Header />
      <main className="flex-1">{children ?? <Outlet />}</main>
      <Footer />
      <FloatingWhatsApp />
      <ChatWidget />
      <CartDrawer />
    </div>
  );
}
