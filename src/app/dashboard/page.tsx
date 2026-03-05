'use client';

import Link from 'next/link';
import { useCollection, useMemoFirebase, useFirestore, useUser, useAuth } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Globe, Briefcase, ChevronRight, LayoutGrid, Zap, Loader2, Sparkles, User as UserIcon, CreditCard, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProjectCard from './project-card';
import { signOut } from 'firebase/auth';

export default function Dashboard() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // UseMemoFirebase ensures the query object is stable to prevent re-subscription loops
  const projectsQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Strict filtering by ownerId to satisfy Firestore 'Rules-as-Filters' security requirements
    return query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: projects, isLoading: projectsLoading } = useCollection(projectsQuery);

  if (isUserLoading || (projectsLoading && !projects)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
              <Sparkles className="h-5 w-5" />
              RANKWITHAI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-bold text-primary">Overview</Link>
              <Link href="/pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-muted-foreground px-3 py-1 bg-muted rounded-full">
              <UserIcon className="h-3 w-3" />
              {user.isAnonymous ? 'ANONYMOUS' : user.email || user.uid.slice(0, 8)}
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 space-y-8 p-6 md:p-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">My Projects</h2>
            <p className="text-muted-foreground font-medium">Manage your B2B content feeds and generation runs.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/pricing">
              <Button variant="outline" className="font-bold rounded-xl h-11 px-6">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button className="font-bold rounded-xl shadow-lg shadow-primary/20 h-11 px-6">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!projects || projects.length === 0 ? (
            <Card className="col-span-full border-dashed p-12 text-center bg-transparent rounded-[2rem]">
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-primary/10 rounded-3xl">
                  <LayoutGrid className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">No projects yet</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                    Create your first project to start generating AI-optimized content feeds.
                  </p>
                </div>
                <Link href="/projects/new" className="mt-4">
                  <Button variant="outline" className="rounded-xl font-bold">Get Started</Button>
                </Link>
              </div>
            </Card>
          ) : (
            projects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>

        <div className="mt-12 bg-primary/5 rounded-[3rem] p-10 md:p-16 border border-primary/10 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="flex-1 space-y-6 relative z-10">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-widest border border-primary/20">
              <Zap className="mr-2 h-3.5 w-3.5" />
              The Deterministic Edge
            </div>
            <h3 className="text-4xl font-black tracking-tighter">Scale with Certainty.</h3>
            <p className="text-muted-foreground leading-relaxed font-medium text-lg">
              Generic AI tools hallucinate details and waste tokens. rankwithai uses deterministic templates to fix the structure, calling LLMs only for specialized body content. 
              <strong> High volume. Low cost. Perfect brand integrity.</strong>
            </p>
          </div>
          <div className="w-full lg:w-2/5 aspect-[4/3] bg-background/50 backdrop-blur-md rounded-3xl shadow-inner border border-border flex items-center justify-center p-8 relative group">
            <div className="text-left space-y-2 w-full font-mono text-[10px] md:text-xs">
              <div className="text-primary/40">&lt;div class="page-skeleton"&gt;</div>
              <div className="pl-4 text-primary">h1: Service in Location</div>
              <div className="pl-4 text-muted-foreground/60">// Deterministic structure applied</div>
              <div className="pl-4 text-orange-500">body: [AI BATCH GENERATED CONTENT]</div>
              <div className="pl-4 text-primary/40">faq: [SCHEMA MARKUP AUTO-INJECTED]</div>
              <div className="text-primary/40">&lt;/div&gt;</div>
              <div className="absolute inset-0 bg-primary/5 rounded-3xl group-hover:bg-transparent transition-colors" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}