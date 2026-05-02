import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';

const ROTATING_WORDS = ['trust', 'audience', 'identity', 'legacy', 'fanbase'];

const HERO_CARDS = [
  {
    title: 'Echo of the Unnamed',
    artist: 'Nova Hymns',
    img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=360&h=360&fit=crop&auto=format',
    rotateInit: -6,
    side: 'left',
    yOffset: 0,
  },
  {
    title: 'Chai Steam Morning',
    artist: 'LoFi Aarav',
    img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=360&h=360&fit=crop&auto=format',
    rotateInit: 4,
    side: 'left2',
    yOffset: 0,
  },
  {
    title: 'Sector Seven Reverie',
    artist: 'DreamCircuit',
    img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&h=360&fit=crop&auto=format',
    rotateInit: 7,
    side: 'right',
    yOffset: 0,
  },
  {
    title: 'The Shape of Absence',
    artist: 'Mira Echo',
    img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=360&h=360&fit=crop&auto=format',
    rotateInit: -4,
    side: 'right2',
    yOffset: 0,
  },
];

function useTypewriter(words: string[], speed = 85, deleteSpeed = 55, pauseMs = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex % words.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && display === current) {
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && display === '') {
      setIsDeleting(false);
      setWordIndex(i => (i + 1) % words.length);
    } else if (!isDeleting) {
      timeout = setTimeout(
        () => setDisplay(current.slice(0, display.length + 1)),
        speed
      );
    } else {
      timeout = setTimeout(
        () => setDisplay(current.slice(0, display.length - 1)),
        deleteSpeed
      );
    }

    return () => clearTimeout(timeout);
  }, [display, isDeleting, wordIndex, words, speed, deleteSpeed, pauseMs]);

  return display;
}

const FLOAT_VARIANTS = [
  { y: [0, -14, 0], duration: 5.2 },
  { y: [0, -10, 0], duration: 6.5 },
  { y: [0, -16, 0], duration: 4.8 },
  { y: [0, -11, 0], duration: 5.9 },
];

export default function Landing() {
  const { user } = useAuth();
  const typed = useTypewriter(ROTATING_WORDS);

  const leftCards = HERO_CARDS.filter(c => c.side === 'left' || c.side === 'left2');
  const rightCards = HERO_CARDS.filter(c => c.side === 'right' || c.side === 'right2');

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4">

        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[380px] bg-secondary/7 rounded-full blur-[120px]" />
        </div>

        {/* Left floating cards */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-5 -translate-x-10 xl:-translate-x-2">
          {leftCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -40 }}
              animate={{
                opacity: 1,
                x: 0,
                y: FLOAT_VARIANTS[i].y,
              }}
              transition={{
                opacity: { duration: 0.9, delay: 0.2 + i * 0.15, ease: 'easeOut' },
                x: { duration: 0.9, delay: 0.2 + i * 0.15, ease: 'easeOut' },
                y: {
                  duration: FLOAT_VARIANTS[i].duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4,
                },
              }}
              style={{ rotate: card.rotateInit }}
              className="w-44 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/8"
            >
              <img
                src={card.img}
                alt={card.title}
                className="w-full aspect-square object-cover"
              />
              <div className="bg-[#16141c] px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground truncate">{card.title}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{card.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right floating cards */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-5 translate-x-10 xl:translate-x-2">
          {rightCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: 40 }}
              animate={{
                opacity: 1,
                x: 0,
                y: FLOAT_VARIANTS[i + 2].y,
              }}
              transition={{
                opacity: { duration: 0.9, delay: 0.3 + i * 0.15, ease: 'easeOut' },
                x: { duration: 0.9, delay: 0.3 + i * 0.15, ease: 'easeOut' },
                y: {
                  duration: FLOAT_VARIANTS[i + 2].duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.6,
                },
              }}
              style={{ rotate: card.rotateInit }}
              className="w-44 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/8"
            >
              <img
                src={card.img}
                alt={card.title}
                className="w-full aspect-square object-cover"
              />
              <div className="bg-[#16141c] px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground truncate">{card.title}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{card.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Center headline */}
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]"
          >
            Your sound.{' '}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              Your story.
            </span>
            <br />
            Their{' '}
            <span className="relative inline-block min-w-[3ch]">
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                {typed}
              </span>
              <span className="inline-block w-[3px] h-[0.85em] bg-secondary align-middle ml-0.5 animate-pulse rounded-full" />
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: 'easeOut' }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            A trust-first platform where AI-assisted creators publish tracks with emotional context, disclose their process, and build a genuine fanbase.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.28, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {!user ? (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center text-base font-semibold bg-foreground text-background px-8 py-3 rounded-full hover:bg-foreground/90 transition-colors duration-150 w-full sm:w-auto"
                >
                  Start Creating
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center text-base font-medium bg-white/8 text-foreground px-8 py-3 rounded-full hover:bg-white/12 transition-colors duration-150 border border-white/10 w-full sm:w-auto"
                >
                  Explore Music
                </Link>
              </>
            ) : (
              <Link
                href={user.role === 'creator' ? '/creator/dashboard' : '/explore'}
                className="inline-flex items-center justify-center text-base font-semibold bg-foreground text-background px-8 py-3 rounded-full hover:bg-foreground/90 transition-colors duration-150"
              >
                {user.role === 'creator' ? 'Go to Dashboard' : 'Explore Music'}
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Trust signal strip ── */}
      <section className="py-10 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/40">
            Every track on Sound2Soul comes with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: '✦', label: 'AI Disclosed' },
              { icon: '✦', label: 'Rights Certified' },
              { icon: '✦', label: 'Soul Story' },
              { icon: '✦', label: 'Creator Identity' },
              { icon: '✦', label: 'Fan Capture' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-primary text-xs">{item.icon}</span>
                <span className="text-sm font-medium text-muted-foreground/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three pillars ── */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">More than playback.</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Sound2Soul gives every track the context listeners deserve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-card/50 p-8 rounded-3xl ring-1 ring-white/6 hover:ring-primary/20 transition-all duration-300 group">
              <div className="h-11 w-11 bg-primary/15 text-primary rounded-2xl flex items-center justify-center mb-7 group-hover:bg-primary/25 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Radical Transparency</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every track carries an AI Process Disclosed badge. Show listeners exactly how AI contributed to your work.
              </p>
            </div>

            <div className="bg-card/50 p-8 rounded-3xl ring-1 ring-white/6 hover:ring-secondary/20 transition-all duration-300 group">
              <div className="h-11 w-11 bg-secondary/15 text-secondary rounded-2xl flex items-center justify-center mb-7 group-hover:bg-secondary/25 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Soul Stories</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every track comes with a Soul Story — the memory, emotion, or moment that sparked its creation.
              </p>
            </div>

            <div className="bg-card/50 p-8 rounded-3xl ring-1 ring-white/6 hover:ring-primary/20 transition-all duration-300 group">
              <div className="h-11 w-11 bg-primary/15 text-primary rounded-2xl flex items-center justify-center mb-7 group-hover:bg-primary/25 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Direct Fan Growth</h3>
              <p className="text-muted-foreground leading-relaxed">
                Capture emails directly from your tracks. Turn casual listeners into fans you own and can reach anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to share your sound?</h2>
          <p className="text-muted-foreground text-lg">Join a community of creators who lead with authenticity.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center text-base font-semibold bg-foreground text-background px-8 py-3 rounded-full hover:bg-foreground/90 transition-colors duration-150 w-full sm:w-auto"
            >
              Create Your Profile
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center text-base font-medium bg-white/8 text-foreground px-8 py-3 rounded-full hover:bg-white/12 transition-colors duration-150 border border-white/10 w-full sm:w-auto"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-white/8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Sound2Soul
          </span>
          <p className="text-xs text-muted-foreground/40">
            &copy; {new Date().getFullYear()} Sound2Soul. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
