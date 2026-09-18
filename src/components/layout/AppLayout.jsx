import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // Constrain to viewport height — this makes the scroll container work for mouse wheel
    <div className="h-screen overflow-hidden bg-background text-on-surface antialiased flex">
      {/* Fixed Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Right side: header + scrollable content, offset by sidebar width */}
      <div className="flex flex-col flex-1 lg:pl-64 h-full">
        {/* Sticky top header */}
        <Header setMobileOpen={setMobileOpen} />

        {/* THIS is the scroll container — fixed height from flex, mouse wheel works here */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}


