
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Info, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { runGeneration } from "@/app/lib/generation-service";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function FeedGenerator({ project }: { project: any }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState([10]);
  const { toast } = useToast();
  const db = useFirestore();

  const runsQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'projects', project.id, 'generationRuns'), 
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [db, project.id]);

  const { data: runs } = useCollection(runsQuery);

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
    setProgress(0);

    try {
      await runGeneration(db, project, pageCount[0], setProgress);
      toast({ title: "Feed Generated!", description: `Successfully created ${pageCount[0]} optimized pages with minimal AI calls.` });
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message || "Something went wrong during generation.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <div className={`p-6 rounded-full transition-all duration-500 ${generating ? 'bg-primary/20 scale-110 shadow-xl' : 'bg-white border'}`}>
          {generating ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          ) : (
            <Sparkles className="h-16 w-16 text-primary" />
          )}
        </div>
        
        <div className="max-w-md space-y-4">
          <h3 className="text-2xl font-bold">
            {generating ? "Executing Batch Generation" : "Cost-Optimized Page Engine"}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed px-4">
            {generating 
              ? "We are currently generating content in batches to ensure maximum quality and credit efficiency."
              : "Generate a strategic SEO footprint using deterministic templates. We only call the AI for high-value body content, saving you credits."
            }
          </p>
        </div>

        {!generating && (
          <div className="w-full max-w-xs space-y-4 pt-4">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium">Target Page Count</Label>
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
          </div>
        )}

        {generating && (
          <div className="w-full max-w-sm space-y-3 px-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{progress < 10 ? 'Skeletoning...' : progress < 90 ? 'Batching AI...' : 'Committing...'}</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 items-center">
          <Button 
            onClick={handleGenerate} 
            size="lg" 
            className="px-12 py-6 text-lg font-bold shadow-lg" 
            disabled={generating || !isComplete}
          >
            {generating ? "Generating..." : "Start Generation Run"}
          </Button>

          {!isComplete && (
            <p className="text-sm text-destructive flex items-center gap-1 bg-destructive/5 px-3 py-1 rounded-full border border-destructive/10">
              <AlertCircle className="h-4 w-4" /> Brand Memory requires: Services, Differentiators, and Tone.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2 text-slate-500">
          <History className="h-4 w-4" /> RECENT GENERATION RUNS
        </h4>
        <div className="grid gap-4">
          {!runs || runs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic">No runs recorded yet.</div>
          ) : (
            runs.map((run: any) => (
              <div key={run.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${run.status === 'completed' ? 'bg-green-500' : run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                  <div>
                    <div className="text-sm font-bold">Run {run.id.slice(0, 5)}</div>
                    <div className="text-[10px] text-slate-500">{run.timestamp?.toDate?.().toLocaleString() || 'Recent'}</div>
                  </div>
                </div>
                <div className="flex gap-6 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <div>
                    <span className="text-slate-900">{run.generatedCount || 0}</span> Pages
                  </div>
                  <div>
                    <span className="text-slate-900">{run.aiCalls || 0}</span> AI Calls
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
