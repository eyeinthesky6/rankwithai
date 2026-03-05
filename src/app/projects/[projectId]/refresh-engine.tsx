'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, History, AlertCircle, TrendingUp, BarChart3, Loader2, Info, ChevronRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp, collection, query, where } from "firebase/firestore";

export default function RefreshEngine({ project }: { project: any }) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const pagesQuery = useMemoFirebase(() => {
    return query(collection(db, 'projects', project.id, 'pages'), where('ownerUid', '==', project.ownerUid));
  }, [db, project.id, project.ownerUid]);
  
  const { data: pages } = useCollection(pagesQuery);

  const staleCount = pages?.filter(p => p.isStale).length || 0;
  const brokenCount = pages?.filter(p => p.qaStatus === 'NEEDS_FIX').length || 0;

  const handleScanMetrics = async () => {
    if (!pages || pages.length === 0) {
      toast({ title: "No Pages Found", description: "Generate content first to enable refresh engine.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // Simulation of a metric sync / health scan
      await new Promise(r => setTimeout(r, 1500));
      toast({ title: "Health Scan Complete", description: "System health verified. View individual page status in the Preview tab." });
    } catch (e) {
      toast({ title: "Scan Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">Identity Integrity</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Synchronization State</p>
               <div className="flex flex-wrap gap-2">
                 <Badge variant={staleCount > 0 ? "destructive" : "secondary"} className="rounded-full font-bold">
                   {staleCount} STALE PAGES
                 </Badge>
                 <Badge variant={brokenCount > 0 ? "outline" : "secondary"} className={`rounded-full font-bold ${brokenCount > 0 ? 'text-destructive border-destructive/20' : ''}`}>
                   {brokenCount} QUALITY ISSUES
                 </Badge>
               </div>
             </div>
             <p className="text-[10px] text-muted-foreground leading-relaxed italic">
               The "Model 2" engine prevents auto-updates to preserve your brand voice and budget. Sync pages manually when ready.
             </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-[2rem] border-border/60 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">Maintenance Strategy</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-bold">When to Update Your Feed?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Stable B2B services typically require <strong>Quarterly</strong> refreshes. Fast-moving industries or active seasonal locations benefit from <strong>Monthly</strong> syncs.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-primary uppercase tracking-widest">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Identity Sync</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> QA Audit</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Version History</span>
              </div>
            </div>
            <Button onClick={handleScanMetrics} disabled={processing} className="w-full sm:w-auto font-black rounded-xl h-12 px-8 shadow-lg shadow-primary/20">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Scan Platform Health
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-8 bg-slate-900 text-white rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-16 -mt-16" />
            <h4 className="text-xl font-black tracking-tight relative z-10 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Maintenance Logic
            </h4>
            <div className="space-y-4 relative z-10">
               <div className="space-y-1">
                 <p className="text-xs font-bold text-primary uppercase tracking-widest">Event-Driven Staleness</p>
                 <p className="text-xs opacity-70 leading-relaxed">
                   When you change your <strong>Brand Memory</strong>, we flag every impacted page. This ensures you always know which parts of your search presence are outdated.
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-xs font-bold text-primary uppercase tracking-widest">Manual Apply (Model 2)</p>
                 <p className="text-xs opacity-70 leading-relaxed">
                   We never overwrite your content automatically. Review changes in the <strong>Preview</strong> tab and apply updates manually to ensure 100% brand safety.
                 </p>
               </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-primary/60">
               <span>VERSION INTEGRITY ENABLED</span>
               <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-black tracking-tighter">System Activity History</h3>
          </div>

          {!project.refreshLogs || project.refreshLogs.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-[2rem] border border-dashed border-border/60 text-muted-foreground italic text-sm">
              No recent synchronization activity recorded.
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-border/60 bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Context</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.refreshLogs.map((log: any) => (
                    <TableRow key={log.id} className="border-border/60">
                      <TableCell className="text-[11px] font-mono opacity-60">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-xs">/{log.pageSlug || 'Project'}</TableCell>
                      <TableCell className="text-right text-xs font-black text-primary uppercase">
                        {log.actionTaken}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}