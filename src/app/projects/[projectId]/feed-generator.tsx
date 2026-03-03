
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { generateFeedAction } from "@/app/lib/actions";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function FeedGenerator({ project }: { project: any }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState([10]);
  const { toast } = useToast();

  const brandMemory = project.brandMemory;
  const isComplete = brandMemory && 
                    brandMemory.companyName && 
                    brandMemory.services?.length > 0 && 
                    brandMemory.differentiators && 
                    brandMemory.tone;

  const handleGenerate = async () => {
    if (!isComplete) {
      toast({ title: "Incomplete Profile", description: "Please complete Brand Memory structural requirements before generating.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setProgress(5);
    
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 1 : prev));
    }, 500);

    try {
      await generateFeedAction(project.id, pageCount[0]);
      setProgress(100);
      toast({ title: "Feed Generated!", description: `Successfully created ${pageCount[0]} optimized pages.` });
    } catch (e) {
      toast({ title: "Generation Failed", description: "Something went wrong during generation.", variant: "destructive" });
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-8">
      <div className={`p-6 rounded-full transition-all duration-500 ${generating ? 'bg-primary/20 scale-110 shadow-xl' : 'bg-muted'}`}>
        {generating ? (
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
        ) : project.pages ? (
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        ) : (
          <Sparkles className="h-16 w-16 text-muted-foreground" />
        )}
      </div>
      
      <div className="max-w-md space-y-4">
        <h3 className="text-2xl font-bold">
          {generating ? "AI Content Engine Running..." : project.pages ? "Feed Ready for Deployment" : "Deterministic Page Generation"}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {generating 
            ? "We are executing a deterministic mix of Service+Location, Service+Industry, and Buyer Question pages using your strict brand memory profile."
            : project.pages 
              ? `You have ${project.pages.length} pages generated. Re-generating will overwrite existing pages with fresh SEO strategy.`
              : "Generating a feed will create semantic, authoritative pages focused on search intent. No fake statistics or hallucinations will be used."
          }
        </p>
      </div>

      {!generating && (
        <div className="w-full max-w-xs space-y-4 pt-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-medium">Pages to Generate</Label>
            <span className="font-bold text-primary">{pageCount[0]}</span>
          </div>
          <Slider 
            value={pageCount} 
            onValueChange={setPageCount} 
            min={5} 
            max={50} 
            step={5} 
            className="w-full"
          />
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Info className="h-3 w-3" /> Minimum 5 pages recommended for SEO footprint.
          </p>
        </div>
      )}

      {generating && (
        <div className="w-full max-w-sm space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs font-mono text-muted-foreground animate-pulse">
            Processing combinations... [Strategy: {brandMemory.tone}]
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 items-center">
        <Button 
          onClick={handleGenerate} 
          size="lg" 
          className="px-12 py-6 text-lg font-bold shadow-lg" 
          disabled={generating || !isComplete}
        >
          {generating ? "Generating..." : project.pages ? "Re-generate Feed" : "Start Content Generation"}
        </Button>

        {!isComplete && (
          <p className="text-sm text-destructive flex items-center gap-1 bg-destructive/5 px-3 py-1 rounded-full border border-destructive/10">
            <AlertCircle className="h-4 w-4" /> Brand Memory requires: Services, Differentiators, and Tone.
          </p>
        )}
      </div>
    </div>
  );
}
