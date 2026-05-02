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
      await joinWaitlistMutation.mutateAsync({
        data: {
          email,
          desiredPlan: selectedPlan
        }
      });
      toast.success("You're on the list!", {
        description: `We'll let you know when the ${selectedPlan} plan is ready.`
      });
      setEmail('');
    } catch (err) {
      toast.error('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground">Choose the plan that fits your creative journey.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="bg-background/50 border-white/10 flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Listener</CardTitle>
              <div className="text-4xl font-bold mt-4 mb-2">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <CardDescription>Everything you need to discover and save music.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Unlimited listening
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Save tracks & follow creators
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Ad-free experience
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/signup">Sign Up Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-card/80 border-primary/50 flex flex-col relative transform md:-translate-y-4 shadow-xl shadow-primary/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              MOST POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Creator Pro</CardTitle>
              <div className="text-4xl font-bold mt-4 mb-2">$9<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <CardDescription>For independent AI-assisted creators.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Custom public profile
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Unlimited track uploads
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Trust Card & Soul Stories
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Direct fan email capture
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Basic analytics
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={() => setSelectedPlan('pro')}>Join Waitlist</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join the Creator Pro waitlist</DialogTitle>
                    <DialogDescription>
                      We're rolling out Pro features slowly. Leave your email to get early access.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinWaitlist} className="space-y-4 pt-4">
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                    />
                    <Button type="submit" className="w-full" disabled={joinWaitlistMutation.isPending}>
                      {joinWaitlistMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          {/* Studio Plan */}
          <Card className="bg-background/50 border-white/10 flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Creator Studio</CardTitle>
              <div className="text-4xl font-bold mt-4 mb-2">$19<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <CardDescription>Advanced tools for serious creators.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Advanced listener analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Priority queue for 'Explore'
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Custom profile themes
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline" onClick={() => setSelectedPlan('studio')}>Join Waitlist</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join the Creator Studio waitlist</DialogTitle>
                    <DialogDescription>
                      We're building advanced features for power users. Get notified when it's ready.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinWaitlist} className="space-y-4 pt-4">
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                    />
                    <Button type="submit" className="w-full" disabled={joinWaitlistMutation.isPending}>
                      {joinWaitlistMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
  );
}
