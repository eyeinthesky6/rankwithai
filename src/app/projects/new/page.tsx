import { createProjectAction } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Info } from "lucide-react";
import Link from "next/link";

export default function NewProject() {
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
            <form action={createProjectAction} className="space-y-4">
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
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-4">
                Initialize Project
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}