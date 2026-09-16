import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header setMobileOpen={setMobileOpen} />
        <main className="w-full pt-16 flex-1 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
