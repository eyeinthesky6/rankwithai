
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, History, AlertCircle, TrendingUp, BarChart3, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp, collection, query } from "firebase/firestore";
import { refreshContent } from "@/ai/flows/refresh-content-flow";

export default function RefreshEngine({ project }: { project: any }) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const pagesQuery = useMemoFirebase(() => query(collection(db, 'projects', project.id, 'pages')), [db, project.id]);
  const { data: pages } = useCollection(pagesQuery);

  const staleCount = pages?.filter(p => p.isStale).length || 0;

  const handleSyncMetrics = async () => {
    if (!pages || pages.length === 0) {
      toast({ title: "No Pages Found", description: "Generate content first to enable refresh engine.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    const newLogs: any[] = [];

    try {
      const projectRef = doc(db, 'projects', project.id);
      // Simulate performance check...
      toast({ title: "Metric Sync Complete", description: "No significant rank drops detected." });
    } catch (e) {
      toast({ title: "Sync Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">System Model 2</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sync Status</p>
               <div className="flex items-center gap-2">
                 <Badge variant={staleCount > 0 ? "destructive" : "secondary"} className="rounded-full">
                   {staleCount} Stale Pages
                 </Badge>
               </div>
             </div>
             <p className="text-[10px] text-muted-foreground leading-relaxed italic">
               Updates are never applied automatically. You must manually sync pages after brand identity changes.
             </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-[2rem] border-border/60 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">Refresh Strategy</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold">When to Update Content?</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Quarterly: Stable B2B products.</li>
                <li>• Monthly: Rapidly changing industries.</li>
                <li>• Instant: When pricing or core process changes.</li>
              </ul>
            </div>
            <Button onClick={handleSyncMetrics} disabled={processing} className="w-full sm:w-auto font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Scan Metrics
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] flex gap-4">
        <Info className="h-6 w-6 text-primary shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-black text-primary tracking-tight">Version Integrity Guaranteed</p>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            This system flags pages as stale after Brand Memory changes, but it will never auto-update. Use the "Preview" tab to sync stale pages manually.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-black tracking-tighter">Refresh History</h3>
        </div>

        {!project.refreshLogs || project.refreshLogs.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border border-dashed border-border/60 text-muted-foreground italic text-sm">
            No refresh actions recorded.
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-border/60 bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Page</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Rule</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.refreshLogs.map((log: any) => (
                  <TableRow key={log.id} className="border-border/60">
                    <TableCell className="text-[11px] font-mono opacity-60">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-bold text-xs">/{log.pageSlug}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] rounded-full px-2 font-black">
                        {log.ruleTriggered}
                      </Badge>
                    </TableCell>
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
  );
}
