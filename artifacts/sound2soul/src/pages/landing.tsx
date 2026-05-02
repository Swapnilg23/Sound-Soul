import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            Build Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI Music</span> Identity
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10"
          >
            A trust-first platform where AI-assisted creators publish tracks with emotional context, disclose their process, and build a genuine fanbase.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {!user ? (
              <>
                <Button size="lg" className="text-lg px-8 py-6 rounded-full w-full sm:w-auto" asChild>
                  <Link href="/signup">Start Creating</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full w-full sm:w-auto border-white/20 hover:bg-white/5" asChild>
                  <Link href="/explore">Explore Music</Link>
                </Button>
              </>
            ) : (
              <Button size="lg" className="text-lg px-8 py-6 rounded-full w-full sm:w-auto" asChild>
                <Link href={user.role === 'creator' ? '/creator/dashboard' : '/explore'}>
                  Go to {user.role === 'creator' ? 'Dashboard' : 'Explore'}
                </Link>
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30 border-y border-white/5 relative z-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">More than just playback.</h2>
            <p className="text-xl text-muted-foreground">Sound2Soul provides the context that listeners crave.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background/50 border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Radical Transparency</h3>
              <p className="text-muted-foreground">Build trust with the "AI Process Disclosed" badge. Show exactly how AI assisted your creative process.</p>
            </div>
            
            <div className="bg-background/50 border border-white/5 p-8 rounded-2xl hover:border-secondary/30 transition-colors">
              <div className="h-12 w-12 bg-secondary/20 text-secondary rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Soul Stories</h3>
              <p className="text-muted-foreground">Every track comes with a Soul Story—the memory, emotion, or moment that inspired its creation.</p>
            </div>

            <div className="bg-background/50 border border-white/5 p-8 rounded-2xl hover:border-accent/30 transition-colors">
              <div className="h-12 w-12 bg-accent text-white rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Direct Fan Growth</h3>
              <p className="text-muted-foreground">Capture emails directly from your tracks. Turn casual listeners into dedicated fans you can reach anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 relative z-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to share your sound?</h2>
          <Button size="lg" className="text-lg px-8 py-6 rounded-full" asChild>
            <Link href="/pricing">View Pricing Plans</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 mt-auto bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 md:mb-0">
            Sound2Soul
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sound2Soul. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
