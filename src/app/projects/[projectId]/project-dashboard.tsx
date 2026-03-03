'use client';

import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Zap, ShieldCheck, FileText, History, AlertCircle, TrendingUp, Cpu, Database, Fingerprint } from "lucide-react";

export default function ProjectDashboard({ project }: { project: any }) {
  const db = useFirestore();

  const pagesQuery = useMemoFirebase(() => query(collection(db, 'projects', project.id, 'pages')), [db, project.id]);
  const { data: pages } = useCollection(pagesQuery);

  const runsQuery = useMemoFirebase(() => query(
    collection(db, 'projects', project.id, 'generationRuns'),
    orderBy('timestamp', 'desc'),
    limit(5)
  ), [db, project.id]);
  const { data: runs } = useCollection(runsQuery);

  // Stats calculation
  const totalPages = pages?.length || 0;
  const avgScore = pages?.length ? Math.round(pages.reduce((acc, p) => acc + (p.contentScore || 0), 0) / pages.length) : 0;
  
  const typeCounts = pages?.reduce((acc: any, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {}) || {};

  const budgetUsed = project.aiUsage?.totalCalls || 0;
  const budgetCap = 50; // Hard cap for MVP
  const budgetPercentage = Math.min(100, (budgetUsed / budgetCap) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[2rem] border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center justify-between">
              Total Pages
              <FileText className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalPages}</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Active Feeds</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center justify-between">
              Avg Content Score
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{avgScore}%</div>
            <Progress value={avgScore} className="h-1.5 mt-2 bg-green-500/10" />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center justify-between">
              AI Budget Used
              <Zap className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{budgetUsed}/{budgetCap}</div>
            <Progress value={budgetPercentage} className="h-1.5 mt-2 bg-amber-500/10" />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center justify-between">
              Project Health
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black uppercase tracking-tighter">Optimized</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Isolation active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> System Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase opacity-50">Identity Hash</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-xl font-mono text-[10px]">
                <Fingerprint className="h-3 w-3 text-primary" />
                <span className="truncate">{project.lastGenerationHash || 'Uninitialized'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase opacity-50">Template Engine</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-xl font-mono text-[10px]">
                <Cpu className="h-3 w-3 text-primary" />
                <span>v{project.templateVersion || '2.0 (Deterministic)'}</span>
              </div>
            </div>
            <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-[10px] text-primary font-bold leading-relaxed">
                Deterministic isolation is enforced. AI budget guards are active for all last-mile edits.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Content Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.entries(typeCounts).map(([type, count]: [string, any]) => (
              <div key={type} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                   <span>{type}</span>
                   <span className="text-primary">{count}</span>
                </div>
                <Progress value={(count / (totalPages || 1)) * 100} className="h-2" />
              </div>
            ))}
            {totalPages === 0 && <p className="text-center py-8 text-xs text-muted-foreground italic">No pages generated yet.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Execution Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {!runs || runs.length === 0 ? (
              <p className="text-center py-8 text-xs text-muted-foreground italic">No generation history.</p>
            ) : (
              runs.map((run: any) => (
                <div key={run.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-2xl border border-transparent hover:border-border/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${run.status === 'completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                    <div className="text-[10px] font-bold uppercase tracking-tight">
                      {run.timestamp?.toDate?.().toLocaleDateString() || 'Recent'}
                    </div>
                  </div>
                  <div className="flex gap-4 text-[10px] font-mono opacity-60">
                    <span>{run.generatedCount || 0} PG</span>
                    <span>{run.aiCalls || 0} AI</span>
                  </div>
                </div>
              ))
            )}
            {runs?.some(r => r.status === 'aborted') && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-start gap-2 mt-4">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-700 font-bold uppercase leading-tight">
                  Budget Guardrail Alert: Some runs were aborted to protect your AI credit balance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
