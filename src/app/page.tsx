'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sparkles, Globe, ArrowRight, LayoutGrid, Loader2, MessageSquare, Zap } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex-1 flex flex-col hero-gradient selection:bg-primary/10">
      <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
              <Sparkles className="h-6 w-6" />
              RANKWITHAI
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isUserLoading ? (
              <Button size="sm" variant="ghost" disabled className="rounded-xl"><Loader2 className="h-4 w-4 animate-spin" /></Button>
            ) : user ? (
              <Link href="/dashboard">
                <Button size="sm" className="font-bold rounded-xl">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline" className="font-bold rounded-xl">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI-Ready Search Presence
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter max-w-4xl mx-auto">
            Become searchable by <span className="text-primary">AI Chatbots.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Add AI-trusted lead capturing pages to your website and be the business that AI search engines find and recommend.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl hover:scale-105 transition-all w-full sm:w-auto"
                disabled={isUserLoading}
              >
                Get AI-Ready <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl w-full">
                View Pricing
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2rem] bg-card border shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">AI-Ready Content</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Chatbots like ChatGPT and Gemini need high-authority data to recommend your business. We build the pages they trust.
              </p>
            </div>
            <div className="p-8 rounded-[2rem] bg-card border shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Trusted Lead Capture</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Every page we generate includes a professional inquiry form designed to turn AI-driven traffic into customers.
              </p>
            </div>
            <div className="p-8 rounded-[2rem] bg-card border shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Set and Forget</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No technical skills required. Our engine handles the complexity so your business stays visible in the age of AI search.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-primary text-white py-24 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Ready to be the #1 recommendation?</h2>
            <p className="text-primary-foreground/80 text-lg font-medium">
              Join businesses using rankwithai to build a search presence that actually works in the age of AI.
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="h-14 px-12 text-lg font-bold rounded-2xl bg-white text-primary hover:bg-slate-100">
                Start AI Journey
              </Button>
            </Link>
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
            <Link href="/pricing" className="hover:text-primary">Pricing</Link>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} rankwithai
          </div>
        </div>
      </footer>
    </div>
  );
}