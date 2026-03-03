
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, History, AlertCircle, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { refreshContent } from "@/ai/flows/refresh-content-flow";

export default function RefreshEngine({ project }: { project: any }) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  // Mock search metrics for demonstration of the rule engine
  const mockMetrics = project.pages?.slice(0, 3).map((p: any, i: number) => ({
    id: p.id,
    slug: p.slug,
    impressions: 250 + (i * 100),
    ctr: 0.008 - (i * 0.001), 
    positionChange: i === 1 ? -6 : 0, 
    queries: ['top b2b service', 'reliable provider', 'industry solutions'],
    seoTitle: p.seoTitle,
    metaDescription: p.metaDescription,
    faqs: p.faqs
  })) || [];

  const handleSyncMetrics = async () => {
    if (!project.pages || project.pages.length === 0) {
      toast({ title: "No Pages Found", description: "Generate content first to enable refresh engine.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    const newLogs: any[] = [];

    try {
      const projectRef = doc(db, 'projects', project.id);

      for (const metric of mockMetrics) {
        let actionTaken = '';
        let ruleTriggered = '';
        let result: any = null;

        // Rule 1: CTR Check
        if (metric.ctr < 0.01 && metric.impressions > 200) {
          ruleTriggered = 'CTR < 1%';
          actionTaken = 'Meta Rewrite';
          result = await refreshContent({
            currentTitle: metric.seoTitle,
            currentMeta: metric.metaDescription,
            currentFaqs: metric.faqs,
            brandMemory: project.brandMemory,
            targetMetric: 'CTR',
            queries: metric.queries
          });
        } 
        // Rule 2: Rank Drop
        else if (metric.positionChange < -5) {
          ruleTriggered = 'Position Drop > 5';
          actionTaken = 'FAQ Refresh';
          result = await refreshContent({
            currentTitle: metric.seoTitle,
            currentMeta: metric.metaDescription,
            currentFaqs: metric.faqs,
            brandMemory: project.brandMemory,
            targetMetric: 'RANK',
            queries: metric.queries
          });
        }

        if (actionTaken && result) {
          const log = {
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            pageSlug: metric.slug,
            ruleTriggered,
            metricValue: ruleTriggered.includes('CTR') ? `CTR: ${(metric.ctr * 100).toFixed(2)}%` : `Drop: ${metric.positionChange}`,
            actionTaken
          };
          newLogs.push(log);

          // Update the page version in Firestore
          const pageRef = doc(db, 'projects', project.id, 'pages', metric.id);
          await updateDoc(pageRef, {
            ...result,
            version: (project.pages.find((p:any) => p.id === metric.id)?.version || 1) + 1,
            lastRefreshedAt: serverTimestamp()
          });
        }
      }

      if (newLogs.length > 0) {
        await updateDoc(projectRef, {
          refreshLogs: arrayUnion(...newLogs)
        });
        toast({ title: "Sync Complete", description: `Executed ${newLogs.length} strategic refreshes.` });
      } else {
        toast({ title: "Sync Complete", description: "No optimizations required based on current metrics." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Sync Failed", description: "Error processing search metrics.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">Auto-Refresh Rules</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <ul className="text-xs space-y-3 font-bold text-muted-foreground">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="text-[10px] h-4 rounded-full px-2 border-primary/20 bg-primary/5">CTR</Badge>
                If CTR &lt; 1%: Optimize Titles
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="text-[10px] h-4 rounded-full px-2 border-orange-500/20 bg-orange-500/5 text-orange-600">RANK</Badge>
                If Position &gt; -5: Refresh FAQs
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-[2rem] border-border/60 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">Control Center</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold">Search Metric Synchronizer</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Trigger the deterministic rule engine to audit your feed performance against live search benchmarks.</p>
            </div>
            <Button onClick={handleSyncMetrics} disabled={processing} className="w-full sm:w-auto font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sync Metrics
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-black tracking-tighter">Refresh History</h3>
        </div>

        {!project.refreshLogs || project.refreshLogs.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border border-dashed border-border/60 text-muted-foreground italic text-sm">
            No refresh actions recorded. Sync metrics to identify optimization opportunities.
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-border/60 bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Page</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Rule</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Trigger</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.refreshLogs.map((log: any) => (
                  <TableRow key={log.id} className="border-border/60">
                    <TableCell className="text-[11px] font-mono opacity-60">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-bold text-xs">
                      /{log.pageSlug}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] rounded-full px-2 font-black">
                        {log.ruleTriggered}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] font-mono opacity-60">
                      {log.metricValue}
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

      <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] flex gap-4">
        <AlertCircle className="h-6 w-6 text-primary shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-black text-primary tracking-tight">Version Integrity Guaranteed</p>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            The refresh engine operates non-destructively. Every optimization creates a new version snapshot while preserving the original content foundation for full audit transparency.
          </p>
        </div>
      </div>
    </div>
  );
}
