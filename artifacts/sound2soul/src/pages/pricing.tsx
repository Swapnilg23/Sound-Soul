import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJoinWaitlist } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Pricing() {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'studio' | null>(null);
  const joinWaitlistMutation = useJoinWaitlist();

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
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Simple, transparent pricing</h1>
          <p className="text-lg text-muted-foreground">Choose the plan that fits your release readiness journey.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">

          {/* Free / Listener Plan */}
          <Card className="bg-card/50 border-white/8 flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Listener</CardTitle>
              <div className="text-4xl font-bold mt-4 mb-2">
                $0<span className="text-lg text-muted-foreground font-normal">/mo</span>
              </div>
              <CardDescription>Discover emotionally rich, creator-certified tracks. Free, forever.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Unlimited discovery
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Save tracks &amp; follow creators
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <AdIcon /> Ad-supported discovery
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full rounded-full" variant="outline" asChild>
                <Link href="/signup">Sign Up Free</Link>
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
                $9<span className="text-lg text-muted-foreground font-normal">/mo</span>
              </div>
              <CardDescription>Build your AI music trust profile before distribution.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Create your trust profile
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Prepare release-ready track pages
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Trust profile, Soul Stories &amp; rights info
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Collect fans before and after release
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Basic release insights
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Ad-free fan experience
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-full" onClick={() => setSelectedPlan('pro')}>
                    Join Waitlist
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
                $19<span className="text-lg text-muted-foreground font-normal">/mo</span>
              </div>
              <CardDescription>Advanced tools to build trust before you distribute.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Everything in Creator Pro
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Advanced release analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Priority placement on Explore
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Custom profile themes
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Dedicated creator support
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-full" variant="outline" onClick={() => setSelectedPlan('studio')}>
                    Join Waitlist
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

        {/* Revenue model note */}
        <p className="text-center text-xs text-muted-foreground/40 mt-12 max-w-md mx-auto">
          Free-tier listeners fund the platform through ads. Pro and Studio subscriptions unlock trust-building creator tools.
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AdIcon() {
  return (
    <svg className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}
