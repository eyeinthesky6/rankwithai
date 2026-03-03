'use client';

import { useState } from 'react';
import { Project } from "@/app/lib/db";
import { Button } from "@/components/ui/button";
import { generateFeedAction } from "@/app/lib/actions";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function FeedGenerator({ project }: { project: Project }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!project.brandMemory) {
      toast({ title: "Incomplete Profile", description: "Please fill out Brand Memory before generating a feed.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setProgress(10);
    
    // Fake progress interval for UX since real GenAI takes a bit
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 5 : prev));
    }, 2000);

    try {
      await generateFeedAction(project.id);
      setProgress(100);
      toast({ title: "Feed Generated!", description: "Successfully created 20-50 optimized pages." });
    } catch (e) {
      toast({ title: "Generation Failed", description: "Something went wrong during generation.", variant: "destructive" });
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
      <div className={`p-4 rounded-full transition-colors ${generating ? 'bg-primary/10' : 'bg-muted'}`}>
        {generating ? (
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        ) : project.pages ? (
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        ) : (
          <Sparkles className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
      
      <div className="max-w-md space-y-2">
        <h3 className="text-xl font-bold">
          {generating ? "AI is crafting your feed..." : project.pages ? "Feed Ready for Review" : "Ready to Start?"}
        </h3>
        <p className="text-muted-foreground">
          {generating 
            ? "We are analyzing your brand memory and generating 20-50 unique, SEO-optimized pages including service, industry, and location pages."
            : project.pages 
              ? `You have already generated ${project.pages.length} pages. You can re-generate them if you've updated your Brand Memory.`
              : "Generating a feed will create a variety of semantic HTML pages focused on conversion and SEO. This process takes about 30-60 seconds."
          }
        </p>
      </div>

      {generating && (
        <div className="w-full max-w-sm space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Estimated completion: 30s remaining</p>
        </div>
      )}

      <Button 
        onClick={handleGenerate} 
        size="lg" 
        className="px-8 bg-primary hover:bg-primary/90" 
        disabled={generating}
      >
        {generating ? "Generating..." : project.pages ? "Re-generate Feed" : "Start Generation"}
      </Button>

      {!project.brandMemory && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" /> Setup Brand Memory first
        </p>
      )}
    </div>
  );
}