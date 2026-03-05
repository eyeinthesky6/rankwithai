'use client';

import { useFirestore, useUser } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Info, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NewProject() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const website = formData.get('website') as string;
    const niche = formData.get('niche') as string;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name,
        website,
        niche,
        ownerUid: user.uid,
        slug,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Project Initialized", description: "Identity core created successfully." });
      router.push(`/projects/${docRef.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Setup Failed", description: "Could not create project." });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col hero-gradient">
      <nav className="border-b bg-background/50 backdrop-blur-md h-16 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
          <Sparkles className="h-5 w-5" />
          RANKWITHAI
        </Link>
        <ThemeToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <Card className="glass-panel rounded-[2rem]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tighter">Initialize Project</CardTitle>
              <CardDescription className="font-medium">
                Define the baseline for your deterministic content engine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest opacity-70">Business Name</Label>
                  <Input id="name" name="name" placeholder="Acme Solutions Inc." required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-xs font-bold uppercase tracking-widest opacity-70">Website URL</Label>
                  <Input id="website" name="website" type="url" placeholder="https://www.acmesolutions.com" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niche" className="text-xs font-bold uppercase tracking-widest opacity-70">Niche / Industry</Label>
                  <Input id="niche" name="niche" placeholder="B2B Cloud Infrastructure" required className="h-12 rounded-xl" />
                  <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 mt-2 bg-muted/50 p-2 rounded-lg">
                    <Info className="h-3.5 w-3.5 text-primary" /> Specificity here reduces AI content drift later.
                  </p>
                </div>
                <Button type="submit" className="w-full h-12 font-black text-lg rounded-xl shadow-lg mt-4" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Start Setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}