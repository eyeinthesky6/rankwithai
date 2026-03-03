
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sparkles, ShieldCheck, Zap, Globe, ArrowRight, BarChart3, ChevronRight, LayoutGrid } from 'lucide-react';
import { useUser, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleStart = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      initiateAnonymousSignIn(auth);
    } else {
      router.push('/dashboard');
    }
  };

  // Redirect to dashboard if user logs in while on this page
  useEffect(() => {
    if (user && !isUserLoading) {
      // Optional: auto-redirect
    }
  }, [user, isUserLoading]);

  return (
    <div className="flex-1 flex flex-col hero-gradient">
      {/* Navigation */}
      <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
            <Sparkles className="h-6 w-6" />
            RANKWITHAI
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="font-bold rounded-xl">Dashboard</Button>
              </Link>
            ) : (
              <Button onClick={() => handleStart()} size="sm" className="font-bold rounded-xl" disabled={isUserLoading}>
                {isUserLoading ? 'Loading...' : 'Get Started'}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
            <Zap className="h-3 w-3" />
            Deterministic AI Content Generation
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter max-w-4xl mx-auto">
            Scale Your B2B Search Presence <span className="text-primary">Without Hallucinations.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            The only SEO engine that respects your budget. Generate thousands of authoritative, service-location feeds using deterministic-first templates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              onClick={() => handleStart()} 
              size="lg" 
              className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl hover:scale-105 transition-all"
              disabled={isUserLoading}
            >
              Launch My Engine <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl">
              View Sample Feed
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2rem] bg-card border shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Identity-Safe Generation</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our Brand Memory architecture ensures AI never invents certifications, fake numbers, or unverifiable claims.
              </p>
            </div>
            <div className="p-8 rounded-[2rem] bg-card border shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Deterministic Batching</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Reduce AI credit burn by 90%. We generate structure locally and use LLMs only for high-value body content.
              </p>
            </div>
            <div className="p-8 rounded-[2rem] bg-card border shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">The Refresh Engine</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connect search metrics to trigger auto-updates. If rank drops or CTR lags, the engine optimizes content automatically.
              </p>
            </div>
          </div>
        </section>

        {/* Rolling CTA */}
        <section className="bg-primary text-white py-24 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Ready to dominate your niche?</h2>
            <p className="text-primary-foreground/80 text-lg font-medium">
              Join B2B leaders using rankwithai to build programmatic content that actually converts.
            </p>
            <Button onClick={() => handleStart()} size="lg" variant="secondary" className="h-14 px-12 text-lg font-bold rounded-2xl bg-white text-primary hover:bg-slate-100">
              Start Free Trial
            </Button>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <LayoutGrid className="w-full h-full" />
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-black text-lg tracking-tighter opacity-50">
            <Sparkles className="h-5 w-5" />
            RANKWITHAI
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary">Docs</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="https://github.com" target="_blank" className="hover:text-primary">GitHub</a>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} rankwithai engine
          </div>
        </div>
      </footer>
    </div>
  );
}
