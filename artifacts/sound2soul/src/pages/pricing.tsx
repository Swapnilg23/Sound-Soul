import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJoinWaitlist } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEffect } from 'react';

export default function Pricing() {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'studio' | null>(null);
  const joinWaitlistMutation = useJoinWaitlist();

  useEffect(() => {
    document.title = 'Pricing | Sound2Soul';
    const description = 'Compare Sound2Soul creator plans for trust profiles, release documentation, fan capture, and launch planning.';
    setMeta('description', description);
    setMeta('og:title', 'Pricing | Sound2Soul', 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', 'Pricing | Sound2Soul');
    setMeta('twitter:description', description);
  }, []);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedPlan) return;
    try {
      await joinWaitlistMutation.mutateAsync({ data: { email, desiredPlan: selectedPlan } });
      toast.success("You're on the list!", {
        description: `We'll let you know when the ${selectedPlan} plan is ready.`
      });
      setEmail('');
    } catch {
      toast.error('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Build trust around every AI-assisted release.</h1>
          <p className="text-lg text-muted-foreground">Sound2Soul helps creators document their process, publish emotionally rich track pages, collect fans, and prepare release profiles before distribution.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">

          {/* Free Creator */}
          <Card className="bg-card/50 border-white/8 flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Free Creator</CardTitle>
              <div className="text-4xl font-bold mt-4 mb-2">
                $0
              </div>
              <CardDescription>Start building creator trust profiles and public track pages.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> 3 public trust profiles
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Public creator profile
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckIcon /> Soul Story track pages
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> AI process disclosure
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Creator-certified rights fields
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Basic fan capture
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Basic plays, likes, saves
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full rounded-full" variant="outline" asChild>
                <Link href="/signup">Start Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Creator Pro */}
          <Card className="bg-card border-primary/40 flex flex-col relative md:-translate-y-4 shadow-2xl shadow-primary/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
              MOST POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Creator Pro</CardTitle>
              <div className="text-4xl font-bold mt-4 mb-2">
                $9/month
              </div>
              <CardDescription>For creators preparing releases and growing their audience.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> 25 public trust profiles
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Distribution readiness checklist
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> AI Music Release Notes
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Fan email export
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> External distribution links
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Advanced creator profile
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Track analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Featured submission eligibility
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-full" onClick={() => setSelectedPlan('pro')}>
                    Join Pro Waitlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-white/10">
                  <DialogHeader>
                    <DialogTitle>Join the Creator Pro waitlist</DialogTitle>
                    <DialogDescription>
                      We're rolling out Pro features slowly. Leave your email to get early access.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinWaitlist} className="space-y-4 pt-4">
                    <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Button type="submit" className="w-full rounded-full" disabled={joinWaitlistMutation.isPending}>
                      {joinWaitlistMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          {/* Creator Studio */}
          <Card className="bg-card/50 border-white/8 flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Creator Studio</CardTitle>
              <div className="text-4xl font-bold mt-4 mb-2">
                $19/month
              </div>
              <CardDescription>For larger catalogs, deeper documentation, and launch planning.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> 100 public trust profiles
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Full release documentation
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Private and unlisted trust profiles
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Priority review
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Portfolio page
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Advanced fan insights
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Launch campaign notes
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Future monetization tools
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-full" variant="outline" onClick={() => setSelectedPlan('studio')}>
                    Join Studio Waitlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-white/10">
                  <DialogHeader>
                    <DialogTitle>Join the Creator Studio waitlist</DialogTitle>
                    <DialogDescription>
                      We're building advanced features for power users. Get notified when it's ready.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinWaitlist} className="space-y-4 pt-4">
                    <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Button type="submit" className="w-full rounded-full" disabled={joinWaitlistMutation.isPending}>
                      {joinWaitlistMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-12 max-w-2xl mx-auto">
          Sound2Soul does not provide distribution, legal clearance, royalty collection, or copyright verification.
        </p>
      </div>
    </div>
  );
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );
}

