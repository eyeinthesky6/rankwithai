
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Zap, ShieldCheck, Globe, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUser } from '@/firebase';

export default function PricingPage() {
  const { user } = useUser();

  const tiers = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for testing the deterministic engine.",
      features: [
        "Up to 2 Projects",
        "50 AI Batch Generations",
        "Standard Templates",
        "Lead Capture (Standard)",
        "rankwithai.com Subdomain"
      ],
      cta: "Get Started",
      highlight: false
    },
    {
      name: "Pro",
      price: "$49",
      description: "Scale your search presence professionally.",
      features: [
        "Unlimited Projects",
        "500 AI Batch Generations",
        "Custom Domain Support",
        "White-label Feed Hosting",
        "Priority Support",
        "Advanced Deterministic Templates"
      ],
      cta: "Upgrade Now",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For agencies and large B2B organizations.",
      features: [
        "Unlimited AI Generations",
        "Dedicated Account Manager",
        "Custom Template Development",
        "SLA Guarantee",
        "API Access",
        "Advanced Analytics Export"
      ],
      cta: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
              <Sparkles className="h-5 w-5" />
              RANKWITHAI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href={user ? "/dashboard" : "/"} className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                {user ? "Dashboard" : "Home"}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="font-bold rounded-xl">Back to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button size="sm" className="font-bold rounded-xl">Get Started</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-20 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Deterministic Pricing.</h1>
          <p className="text-lg text-muted-foreground font-medium">
            No hidden fees. No credit-burn surprises. Scale your B2B search presence with absolute budget clarity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`relative flex flex-col rounded-[2.5rem] overflow-hidden border-border/60 transition-all hover:shadow-2xl hover:-translate-y-1 ${tier.highlight ? 'ring-2 ring-primary shadow-xl shadow-primary/10' : ''}`}>
              {tier.highlight && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                  Most Popular
                </div>
              )}
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-black">{tier.name}</CardTitle>
                <CardDescription className="font-medium text-base">{tier.description}</CardDescription>
                <div className="pt-6">
                  <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                  {tier.price !== "Custom" && <span className="text-muted-foreground font-bold ml-2">/mo</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-8 pt-0 space-y-4">
                <div className="h-px bg-border/50 mb-6" />
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className={`w-full h-12 rounded-xl font-black text-base ${tier.highlight ? 'shadow-lg shadow-primary/20' : ''}`} variant={tier.highlight ? "default" : "outline"}>
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="bg-muted/30 rounded-[3rem] p-12 md:p-20 flex flex-col md:flex-row items-center gap-12 border border-border/50">
          <div className="flex-1 space-y-6">
            <h3 className="text-3xl font-black tracking-tighter">Why deterministic-first?</h3>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
              Most AI platforms bill you for "tokens" without explaining the risk of hallucinations. We isolate your 
              <strong> Brand Memory</strong> and use it to build structured content that actually converts B2B leads.
            </p>
            <div className="flex flex-wrap gap-4">
              <Badge variant="outline" className="bg-background px-4 py-1.5 rounded-full font-bold">90% Cost Reduction</Badge>
              <Badge variant="outline" className="bg-background px-4 py-1.5 rounded-full font-bold">Zero Hallucinations</Badge>
              <Badge variant="outline" className="bg-background px-4 py-1.5 rounded-full font-bold">100% Brand Safety</Badge>
            </div>
          </div>
          <div className="w-full md:w-1/3 grid grid-cols-2 gap-4">
            <div className="p-6 bg-background rounded-3xl border shadow-sm flex flex-col items-center justify-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xs font-black uppercase">Fast</span>
            </div>
            <div className="p-6 bg-background rounded-3xl border shadow-sm flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-green-500" />
              <span className="text-xs font-black uppercase">Secure</span>
            </div>
            <div className="p-6 bg-background rounded-3xl border shadow-sm flex flex-col items-center justify-center gap-2">
              <Globe className="h-6 w-6 text-blue-500" />
              <span className="text-xs font-black uppercase">Global</span>
            </div>
            <div className="p-6 bg-background rounded-3xl border shadow-sm flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-500" />
              <span className="text-xs font-black uppercase">AI Ready</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-black text-lg tracking-tighter opacity-50">
            <Sparkles className="h-5 w-5" />
            RANKWITHAI
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} rankwithai engine
          </div>
        </div>
      </footer>
    </div>
  );
}
