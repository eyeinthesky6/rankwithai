'use client';

import { useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function NewProject() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const website = formData.get('website') as string;
    const niche = formData.get('niche') as string;
    const ownerId = "anonymous-user";

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name,
        website,
        niche,
        ownerId,
        slug,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Project Created", description: "Your new project has been initialized." });
      router.push(`/projects/${docRef.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create project." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background hero-gradient">
      <div className="w-full max-w-xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <Card className="glass-panel">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>
              Enter the core details of the business to initialize its profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input id="name" name="name" placeholder="Acme Solutions Inc." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input id="website" name="website" type="url" placeholder="https://www.acmesolutions.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="niche">Niche / Industry</Label>
                <Input id="niche" name="niche" placeholder="B2B Cloud Infrastructure" required />
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> Be specific for better AI suggestions later.
                </p>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-4" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Initialize Project"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
