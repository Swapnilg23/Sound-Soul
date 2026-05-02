import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useCreateCreatorProfile } from '@workspace/api-client-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Music, Sparkles, Shield, CheckCircle2, ChevronRight, ChevronLeft,
  User, Mic2, Wand2, BookOpen, Rocket, ExternalLink,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const GENRES = [
  'Lo-Fi', 'Pop', 'Cinematic', 'Ambient', 'EDM', 'Hip-Hop',
  'Acoustic', 'Experimental', 'Neoclassical', 'Synthwave', 'Jazz', 'Soul',
  'R&B', 'Electronic', 'Folk', 'Trap',
];
const MOOD_TAGS = [
  'Calm', 'Hopeful', 'Nostalgic', 'Cinematic', 'Focus', 'Healing',
  'Romantic', 'Dark', 'Energetic', 'Spiritual', 'Playful', 'Dreamy',
  'Melancholic', 'Uplifting', 'Intense', 'Ethereal',
];
const AI_TOOLS = [
  'Suno', 'Udio', 'ElevenLabs', 'Splice', 'Boomy', 'MusicGen',
  'Magenta', 'AIVA', 'Soundraw', 'Beatoven', 'None / Human only', 'Other',
];

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  artistName: z.string().min(2, 'Artist name must be at least 2 characters').max(60, 'Max 60 characters'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  creatorStatement: z.string().max(300, 'Max 300 characters').optional(),
  genres: z.array(z.string()).min(1, 'Select at least one genre'),
  moodIdentityTags: z.array(z.string()).min(1, 'Select at least one mood'),
  aiToolsUsed: z.array(z.string()).min(1, 'Select at least one option'),
  guidelinesAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the guidelines to continue' }) }),
});

type FormValues = z.infer<typeof schema>;

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Welcome', icon: Rocket },
  { id: 1, label: 'Identity', icon: User },
  { id: 2, label: 'Your Sound', icon: Music },
  { id: 3, label: 'AI Tools', icon: Wand2 },
  { id: 4, label: 'Guidelines', icon: Shield },
  { id: 5, label: 'Ready', icon: CheckCircle2 },
];

const SLIDE = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── Main component ────────────────────────────────────────────────────────────

export default function CreatorOnboarding() {
  const [, setLocation] = useLocation();
  const createProfile = useCreateCreatorProfile();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [artistSlugPreview, setArtistSlugPreview] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      artistName: '',
      bio: '',
      creatorStatement: '',
      genres: [],
      moodIdentityTags: [],
      aiToolsUsed: [],
      guidelinesAccepted: undefined as any,
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedName = watch('artistName');

  React.useEffect(() => {
    setArtistSlugPreview(
      watchedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 40)
    );
  }, [watchedName]);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const validateStep = async (current: number): Promise<boolean> => {
    if (current === 1) return form.trigger(['artistName', 'bio', 'creatorStatement']);
    if (current === 2) return form.trigger(['genres', 'moodIdentityTags']);
    if (current === 3) return form.trigger(['aiToolsUsed']);
    if (current === 4) return form.trigger(['guidelinesAccepted']);
    return true;
  };

  const handleNext = async () => {
    if (step === 0) { go(1); return; }
    const valid = await validateStep(step);
    if (valid) go(step + 1);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await createProfile.mutateAsync({ data: values });
      go(5);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastFormStep = step === 4;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col relative">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/6 rounded-full blur-[120px]" />
      </div>

      {/* Progress bar */}
      {step > 0 && step < 5 && (
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      )}

      {/* Step pills */}
      {step > 0 && step < 5 && (
        <div className="flex items-center justify-center gap-1.5 pt-6 px-4">
          {STEPS.slice(1, 5).map((s, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : done ? 'bg-white/5 text-green-400 border border-green-500/20'
                    : 'bg-white/3 text-muted-foreground/40 border border-white/5'
                }`}>
                  {done
                    ? <CheckCircle2 className="h-3 w-3" />
                    : React.createElement(s.icon, { className: 'h-3 w-3' })}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 3 && <div className={`h-px w-4 sm:w-8 ${step > idx ? 'bg-green-500/30' : 'bg-white/5'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >
              {step === 0 && <StepWelcome onNext={() => go(1)} />}
              {step === 1 && (
                <StepIdentity
                  register={register}
                  errors={errors}
                  bio={watch('bio') || ''}
                  statement={watch('creatorStatement') || ''}
                  artistName={watchedName}
                  slugPreview={artistSlugPreview}
                />
              )}
              {step === 2 && (
                <StepSound
                  control={control}
                  errors={errors}
                  genres={watch('genres')}
                  moods={watch('moodIdentityTags')}
                  setValue={setValue}
                />
              )}
              {step === 3 && (
                <StepAITools
                  control={control}
                  errors={errors}
                  tools={watch('aiToolsUsed')}
                  setValue={setValue}
                />
              )}
              {step === 4 && (
                <StepGuidelines
                  control={control}
                  errors={errors}
                  accepted={watch('guidelinesAccepted')}
                  setValue={setValue}
                />
              )}
              {step === 5 && (
                <StepComplete
                  artistName={watch('artistName')}
                  slugPreview={artistSlugPreview}
                  onGo={() => setLocation('/creator/dashboard')}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step > 0 && step < 5 && (
            <div className="flex items-center justify-between mt-8">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-white"
                onClick={() => go(step - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>

              {isLastFormStep ? (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 rounded-full"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>Complete Profile <Rocket className="h-4 w-4" /></>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 rounded-full"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  const items = [
    { icon: Shield, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', label: 'Trust Card', desc: 'Every track carries your AI disclosure and rights certification — visible to every listener.' },
    { icon: Mic2, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Soul Story', desc: 'Share the emotional origin of your music. Listeners connect with the person behind the track.' },
    { icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', label: 'Soul Score', desc: 'Your influence grows with every play, like, save, and follow. Watch it climb as your community does.' },
    { icon: Music, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Fan Capture', desc: 'Listeners can join your mailing list directly from your track page. Your audience, your relationship.' },
  ];

  return (
    <div className="text-center space-y-8">
      <div>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 mb-6">
          <Rocket className="h-8 w-8 text-violet-400" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3">Welcome, creator.</h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
          Let's set up your Sound2Soul profile. It takes about 2 minutes and here's what you'll unlock:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {items.map(item => (
          <div key={item.label} className={`p-4 rounded-2xl border ${item.bg} flex gap-3`}>
            <div className={`mt-0.5 flex-shrink-0 ${item.color}`}>
              {React.createElement(item.icon, { className: 'h-5 w-5' })}
            </div>
            <div>
              <p className={`text-sm font-semibold mb-0.5 ${item.color}`}>{item.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={onNext}
        className="gap-2 bg-violet-600 hover:bg-violet-500 text-white px-10 py-3 text-base rounded-full"
      >
        Get started <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

// ── Step 1: Identity ──────────────────────────────────────────────────────────

function StepIdentity({
  register, errors, bio, statement, artistName, slugPreview,
}: {
  register: any; errors: any; bio: string; statement: string;
  artistName: string; slugPreview: string;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={User}
        color="violet"
        title="Your creator identity"
        desc="This is what listeners will see on your public profile."
      />

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Artist Name <Required /></label>
          <Input
            {...register('artistName')}
            placeholder="e.g. Nova Hymns"
            className="bg-white/5 border-white/10 focus:border-violet-500/50 rounded-xl text-base"
            autoFocus
          />
          {errors.artistName && <p className="text-xs text-destructive mt-1">{errors.artistName.message}</p>}
          {slugPreview && (
            <p className="text-xs text-muted-foreground/50 mt-1.5">
              Your profile URL: <span className="text-violet-400/70">sound2soul.com/creator/{slugPreview}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Bio <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            {...register('bio')}
            placeholder="Tell listeners who you are, where you're from, what drives your music…"
            className="bg-white/5 border-white/10 focus:border-violet-500/50 rounded-xl resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground/40 mt-1 text-right">{bio.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Creator Statement <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <p className="text-xs text-muted-foreground/60 mb-2">What does your music help people feel or do? This appears as a pull-quote on your profile.</p>
          <Textarea
            {...register('creatorStatement')}
            placeholder="e.g. I make music for people who think too much at 2am."
            className="bg-white/5 border-white/10 focus:border-violet-500/50 rounded-xl resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground/40 mt-1 text-right">{statement.length}/300</p>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Sound ─────────────────────────────────────────────────────────────

function StepSound({ control, errors, genres, moods, setValue }: any) {
  const toggle = (field: 'genres' | 'moodIdentityTags', arr: string[], item: string) => {
    setValue(field, arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item], { shouldValidate: true });
  };

  return (
    <div className="space-y-7">
      <StepHeader
        icon={Music}
        color="amber"
        title="Your sound"
        desc="Help listeners discover you. Select everything that describes your music."
      />

      <div>
        <p className="text-sm font-medium text-white mb-3">Genres <Required /> <span className="text-muted-foreground font-normal">(pick any that apply)</span></p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <PillToggle
              key={g}
              label={g}
              active={genres.includes(g)}
              onClick={() => toggle('genres', genres, g)}
              color="amber"
            />
          ))}
        </div>
        {errors.genres && <p className="text-xs text-destructive mt-2">{errors.genres.message}</p>}
      </div>

      <div>
        <p className="text-sm font-medium text-white mb-3">Mood Identity <Required /> <span className="text-muted-foreground font-normal">(emotional spaces you occupy)</span></p>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map(m => (
            <PillToggle
              key={m}
              label={m}
              active={moods.includes(m)}
              onClick={() => toggle('moodIdentityTags', moods, m)}
              color="violet"
            />
          ))}
        </div>
        {errors.moodIdentityTags && <p className="text-xs text-destructive mt-2">{errors.moodIdentityTags.message}</p>}
      </div>
    </div>
  );
}

// ── Step 3: AI Tools ──────────────────────────────────────────────────────────

function StepAITools({ control, errors, tools, setValue }: any) {
  const toggle = (item: string) => {
    setValue('aiToolsUsed', tools.includes(item) ? tools.filter((x: string) => x !== item) : [...tools, item], { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <StepHeader
        icon={Wand2}
        color="cyan"
        title="Your AI toolkit"
        desc="Be transparent about the tools in your creative workflow. This builds listener trust — and powers your Trust Card."
      />

      <div className="bg-cyan-500/6 border border-cyan-500/15 rounded-2xl p-4 text-sm text-cyan-300/70 leading-relaxed">
        Sound2Soul celebrates AI creativity. We only ask that you're honest about it. Transparency here directly improves your Trust Score.
      </div>

      <div>
        <p className="text-sm font-medium text-white mb-3">
          Tools you use <Required /> <span className="text-muted-foreground font-normal">(select all that apply — or "None / Human only")</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {AI_TOOLS.map(t => (
            <PillToggle
              key={t}
              label={t}
              active={tools.includes(t)}
              onClick={() => toggle(t)}
              color="cyan"
            />
          ))}
        </div>
        {errors.aiToolsUsed && <p className="text-xs text-destructive mt-2">{errors.aiToolsUsed.message}</p>}
      </div>
    </div>
  );
}

// ── Step 4: Guidelines ────────────────────────────────────────────────────────

function StepGuidelines({ control, errors, accepted, setValue }: any) {
  const rules = [
    { icon: '✦', text: 'Only publish music you own the rights to distribute.' },
    { icon: '✦', text: 'Accurately disclose AI involvement on every track.' },
    { icon: '✦', text: 'No hate speech, harassment, or deepfakes of real artists without consent.' },
    { icon: '✦', text: 'No fake plays, purchased followers, or engagement manipulation.' },
    { icon: '✦', text: 'Soul Stories must be genuine — not fabricated or misleading.' },
  ];

  return (
    <div className="space-y-6">
      <StepHeader
        icon={Shield}
        color="violet"
        title="Community guidelines"
        desc="Sound2Soul is a trust-first platform. These are the commitments we ask of every creator."
      />

      <div className="bg-card/30 border border-white/8 rounded-2xl p-5 space-y-3">
        {rules.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-violet-400 text-xs mt-0.5 flex-shrink-0">{r.icon}</span>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs">
        <a
          href="/legal/creator-guidelines"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
        >
          Full Creator Guidelines <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="/legal/ai-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
        >
          AI Usage Policy <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <button
        type="button"
        onClick={() => setValue('guidelinesAccepted', accepted ? undefined as any : true, { shouldValidate: true })}
        className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 text-left ${
          accepted
            ? 'bg-violet-500/15 border-violet-500/40 text-white'
            : 'bg-white/3 border-white/10 text-muted-foreground hover:border-white/20'
        }`}
      >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          accepted ? 'bg-violet-500 border-violet-500' : 'border-white/20'
        }`}>
          {accepted && <CheckCircle2 className="h-4 w-4 text-white" />}
        </div>
        <div>
          <p className="text-sm font-medium">I agree to Sound2Soul's Creator Guidelines and AI Usage Policy</p>
          <p className="text-xs text-muted-foreground mt-0.5">I'll be honest about my process and respectful to the community.</p>
        </div>
      </button>

      {errors.guidelinesAccepted && (
        <p className="text-xs text-destructive">{errors.guidelinesAccepted.message}</p>
      )}
    </div>
  );
}

// ── Step 5: Complete ──────────────────────────────────────────────────────────

function StepComplete({ artistName, slugPreview, onGo }: { artistName: string; slugPreview: string; onGo: () => void }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/creator/${slugPreview}`;

  const copy = async () => {
    await navigator.clipboard.writeText(profileUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nextSteps = [
    { icon: Music, label: 'Upload your first track', href: '/creator/upload', cta: 'Upload now', color: 'violet' },
    { icon: Sparkles, label: 'View your dashboard', href: '/creator/dashboard', cta: 'Open dashboard', color: 'amber' },
    { icon: BookOpen, label: 'Read the Creator Guidelines', href: '/legal/creator-guidelines', cta: 'Read now', external: true, color: 'cyan' },
  ];

  return (
    <div className="text-center space-y-8">
      <div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/30 to-amber-500/20 border border-violet-500/30 mb-6"
        >
          <CheckCircle2 className="h-10 w-10 text-violet-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-4xl font-black text-white mb-3"
        >
          You're live, {artistName.split(' ')[0]}.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-muted-foreground text-base"
        >
          Your Sound2Soul creator profile is ready. Share it with the world.
        </motion.p>
      </div>

      {/* Profile URL */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
      >
        <span className="flex-1 text-sm text-muted-foreground truncate text-left">{profileUrl}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs text-violet-400 hover:text-violet-300 font-medium flex-shrink-0 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </motion.div>

      {/* Next steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="space-y-2 text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">What's next</p>
        {nextSteps.map(step => (
          step.external ? (
            <a
              key={step.label}
              href={step.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 transition-all group"
            >
              <NextStepContent step={step} />
            </a>
          ) : (
            <Link key={step.label} href={step.href}>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 transition-all group cursor-pointer">
                <NextStepContent step={step} />
              </div>
            </Link>
          )
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Button
          type="button"
          onClick={onGo}
          className="gap-2 bg-violet-600 hover:bg-violet-500 text-white px-10 py-3 text-base rounded-full w-full"
        >
          Go to Dashboard <ChevronRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}

function NextStepContent({ step }: { step: any }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-500/15 text-violet-400',
    amber: 'bg-amber-500/15 text-amber-400',
    cyan: 'bg-cyan-500/15 text-cyan-400',
  };
  return (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[step.color]}`}>
        {React.createElement(step.icon, { className: 'h-5 w-5' })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-white transition-colors">{step.label}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function StepHeader({ icon, color, title, desc }: { icon: any; color: 'violet' | 'amber' | 'cyan'; title: string; desc: string }) {
  const colors = {
    violet: 'bg-violet-500/15 border-violet-500/25 text-violet-400',
    amber: 'bg-amber-500/15 border-amber-500/25 text-amber-400',
    cyan: 'bg-cyan-500/15 border-cyan-500/25 text-cyan-400',
  };
  return (
    <div className="space-y-4">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${colors[color]}`}>
        {React.createElement(icon, { className: 'h-6 w-6' })}
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PillToggle({
  label, active, onClick, color,
}: {
  label: string; active: boolean; onClick: () => void; color: 'violet' | 'amber' | 'cyan';
}) {
  const active_cls = {
    violet: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
        active
          ? active_cls[color]
          : 'bg-white/3 text-muted-foreground border-white/10 hover:border-white/20 hover:text-white'
      }`}
    >
      {active && <span className="mr-1.5">✓</span>}
      {label}
    </button>
  );
}

function Required() {
  return <span className="text-violet-400 ml-0.5">*</span>;
}
