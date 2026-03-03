
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { processMetricsAction } from "@/app/lib/actions";
import { Activity, RefreshCw, History, AlertCircle, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RefreshEngine({ project }: { project: any }) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Mock search metrics for demonstration
  const mockMetrics = project.pages?.slice(0, 3).map((p: any, i: number) => ({
    slug: p.slug,
    impressions: 250 + (i * 100),
    ctr: 0.008 - (i * 0.001), // Under 1% to trigger CTR rule
    positionChange: i === 1 ? -6 : 0, // Triggers rank drop rule for the second page
    queries: ['top b2b service', 'reliable provider', 'industry solutions']
  })) || [];

  const handleSimulateRefresh = async () => {
    if (!project.pages || project.pages.length === 0) {
      toast({ title: "No Pages", description: "Generate some pages first.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const logs = await processMetricsAction(project.id, mockMetrics);
      toast({ 
        title: "Refresh Engine Complete", 
        description: logs.length > 0 
          ? `Executed ${logs.length} optimizations based on rules.` 
          : "No optimizations required at this time." 
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to process metrics.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Auto-Refresh Rules</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <Badge variant="outline" className="text-[10px] h-4">CTR</Badge>
                If CTR &lt; 1% and Impr &gt; 200: Rewrite Meta
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="text-[10px] h-4">RANK</Badge>
                If Position drops &gt; 5: Refresh FAQs
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Control Center</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Simulate a Search Console sync to trigger deterministic refresh rules.</p>
              <Button onClick={handleSimulateRefresh} disabled={processing} className="w-full">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync Search Metrics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Refresh History Log</h3>
        </div>

        {!project.refreshLogs || project.refreshLogs.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed text-muted-foreground italic">
            No refresh actions logged yet. Run a sync to identify optimization opportunities.
          </div>
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.refreshLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      /{log.pageSlug}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {log.ruleTriggered}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                      {log.metricValue}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-primary">
                      {log.actionTaken}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-900">Version Integrity</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            The refresh engine preserves all original content. Optimizations are stored as new versions, allowing you to rollback or audit strategic changes made by the AI.
          </p>
        </div>
      </div>
    </div>
  );
}
