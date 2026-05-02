import React from 'react';
import { Navbar } from './Navbar';

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark selection:bg-primary/30">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
};
