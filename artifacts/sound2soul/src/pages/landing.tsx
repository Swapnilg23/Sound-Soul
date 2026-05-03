import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Do I need to use AI to create music here?',
    a: 'No. Sound2Soul welcomes all creators — whether you use AI tools or create entirely by hand. The platform is built for trust-first publishing, not any specific production method. Human-made music is celebrated just as much as AI-assisted work.',
  },
  {
    q: 'What does "AI Disclosed" mean on a track?',
    a: 'When creators upload a track, they declare exactly how AI was involved — from "no AI" to "fully AI-generated." This badge gives listeners honest context about the creative process. Transparency is the foundation Sound2Soul is built on.',
  },
  {
    q: 'Who owns my music after I publish it?',
    a: 'You do. Sound2Soul does not claim ownership of your tracks. By publishing, you grant us a limited, non-exclusive licence to stream and display your music on the platform. You can remove your content at any time.',
  },
  {
    q: 'Can I make money from my music on Sound2Soul?',
    a: 'Monetisation tools for creators are in active development — including fan support, premium collections, and licensing pathways. We\'ll notify creators when these launch. Building your audience now means you\'ll be ready.',
  },
  {
    q: 'What is a Soul Story?',
    a: 'A Soul Story is your track\'s emotional origin — the memory, feeling, or moment that inspired its creation. It\'s the human layer behind the music. Listeners can also contribute their own Soul Stories to tracks they connect with.',
  },
  {
    q: 'How is Soul Score calculated?',
    a: 'Soul Score is your influence metric on Sound2Soul. It combines plays (×1), likes (×5), saves (×3), and followers (×10) into a single number. It grows as your community does — and resets to reflect your ongoing momentum.',
  },
  {
    q: 'How does fan collection work?',
    a: 'Listeners can follow creators, save tracks to their Library, and join a creator\'s mailing list directly from the track page. Creators own their fan relationships — Sound2Soul is the platform where those relationships form.',
  },
  {
    q: 'How do I report content that violates the rules?',
    a: 'Every track page has a report button. Our moderation team reviews all reports within 48 hours. Creators who repeatedly violate our Creator Guidelines are removed from the platform.',
  },
];

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
            Your{' '}
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
            A platform where AI-assisted creators publish tracks with emotional context, disclose their process, and build a genuine fanbase.
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
              <h3 className="text-xl font-bold mb-3">Real Audience Growth</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every follow, save, and play builds your presence on Sound2Soul. Listeners discover you here — and come back here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Got questions?</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Frequently asked</h2>
          </div>
          <div className="divide-y divide-white/6">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
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

      {/* ── Site Footer ── */}
      <SiteFooter />
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 text-left group"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors duration-150">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-primary' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pt-3 pb-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
