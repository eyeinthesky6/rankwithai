
'use client';

import { useState } from 'react';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc, arrayUnion } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, CheckCircle, AlertTriangle, Hammer, Loader2, ExternalLink, RefreshCw, Sparkles, MessageSquare, AlertCircle, Scissors, RefreshCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { validatePageContent } from "@/app/lib/quality-validator";
import { autoFixPage } from "@/app/lib/auto-fixer";
import { refreshContent } from "@/ai/flows/refresh-content-flow";
import { checkAndLogRepairBudget } from "@/app/lib/generation-service";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { v4 as uuidv4 } from 'uuid';

export default function PreviewScreen({ project }: { project: any }) {
  const [filter, setFilter] = useState('');
  const [activePage, setActivePage] = useState<any>(null);
  const [fixing, setFixing] = useState<string | null>(null);
  const [repairAction, setRepairAction] = useState<{ type: string, sectionIdx?: number } | null>(null);
  const [showRepairConfirm, setShowRepairConfirm] = useState(false);
  
  const db = useFirestore();
  const { toast } = useToast();

  const pagesQuery = useMemoFirebase(() => {
    return query(collection(db, 'projects', project.id, 'pages'), orderBy('createdAt', 'desc'));
  }, [db, project.id]);

  const { data: pages, isLoading } = useCollection(pagesQuery);

  const stalePages = pages?.filter(p => p.isStale) || [];

  const handleRunQA = (page: any) => {
    const result = validatePageContent(page);
    const pageRef = doc(db, 'projects', project.id, 'pages', page.id);
    
    const updates = {
      qaStatus: result.status,
      qaIssues: result.issues,
      contentScore: result.score,
      qaCheckedAt: new Date().toISOString()
    };

    updateDocumentNonBlocking(pageRef, updates);

    toast({ title: "QA Audit Complete", description: `Page scored ${result.score}% with ${result.issues.length} issue(s) found.` });
    if (activePage?.id === page.id) setActivePage({ ...page, ...updates });
  };

  const handleAutoFix = (page: any) => {
    setFixing(page.id);
    try {
      const { fixedPage, summary } = autoFixPage(page, project.brandMemory);
      const pageRef = doc(db, 'projects', project.id, 'pages', page.id);
      const projectRef = doc(db, 'projects', project.id);
      
      const finalQuality = validatePageContent(fixedPage);
      
      const finalPage = {
        ...fixedPage,
        qaStatus: finalQuality.status,
        qaIssues: finalQuality.issues,
        contentScore: finalQuality.score,
        lastFixSummary: summary,
        updatedAt: new Date().toISOString()
      };

      updateDocumentNonBlocking(pageRef, finalPage);
      
      // Log deterministic fix activity
      updateDocumentNonBlocking(projectRef, {
        refreshLogs: arrayUnion({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          pageSlug: page.slug,
          ruleTriggered: 'Structural Audit',
          actionTaken: 'AUTO_FIX'
        })
      });

      toast({ title: "Deterministic Fix Applied", description: `Applied fix: ${summary}` });
      if (activePage?.id === page.id) setActivePage(finalPage);
    } catch (e) {
      toast({ title: "Repair Engine Error", description: "An unexpected error occurred during the fix.", variant: "destructive" });
    } finally {
      setFixing(null);
    }
  };

  const handleApplyBrandUpdates = (page: any) => {
    setFixing(page.id);
    try {
      const { fixedPage, summary } = autoFixPage(page, project.brandMemory);
      const pageRef = doc(db, 'projects', project.id, 'pages', page.id);
      const projectRef = doc(db, 'projects', project.id);
      const newHash = JSON.stringify(project.brandMemory).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0).toString();

      updateDocumentNonBlocking(pageRef, {
        ...fixedPage,
        brandMemoryHash: newHash,
        isStale: false,
        lastFixSummary: `Strategic Sync: ${summary}`,
        updatedAt: new Date().toISOString()
      });

      // Log sync activity
      updateDocumentNonBlocking(projectRef, {
        refreshLogs: arrayUnion({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          pageSlug: page.slug,
          ruleTriggered: 'Identity Hash Mismatch',
          actionTaken: 'STRATEGIC_SYNC'
        })
      });

      toast({ title: "Strategy Synchronized", description: "The page has been updated with the latest brand memory." });
      if (activePage?.id === page.id) setActivePage({ ...fixedPage, isStale: false });
    } catch (e) {
      toast({ title: "Sync Failed", description: "Could not sync the page with the latest brand memory.", variant: "destructive" });
    } finally {
      setFixing(null);
    }
  };

  const executeAiRepair = async () => {
    if (!repairAction || !activePage) return;
    setFixing(activePage.id);
    setShowRepairConfirm(false);

    try {
      await checkAndLogRepairBudget(db, project, repairAction.type, activePage.slug);

      const refreshInput: any = {
        actionType: repairAction.type,
        brandMemory: project.brandMemory,
        context: {
          currentTitle: activePage.seoTitle,
          currentMeta: activePage.metaDescription,
          currentContent: activePage.sections.map((s:any) => s.content).join(' '),
          currentFaqs: activePage.faqs
        }
      };

      if (repairAction.sectionIdx !== undefined) {
        const section = activePage.sections[repairAction.sectionIdx];
        refreshInput.context.sectionHeading = section.h2;
        refreshInput.context.currentContent = section.content;
      }

      const result = await refreshContent(refreshInput);
      const pageRef = doc(db, 'projects', project.id, 'pages', activePage.id);
      const projectRef = doc(db, 'projects', project.id);
      
      const updates: any = {
        updatedAt: new Date().toISOString(),
        version: (activePage.version || 1) + 1,
        lastFixSummary: `AI Repair: ${repairAction.type}`
      };

      if (result.seoTitle) updates.seoTitle = result.seoTitle;
      if (result.metaDescription) updates.metaDescription = result.metaDescription;
      if (result.faqs) updates.faqs = result.faqs;
      
      if (result.content && repairAction.sectionIdx !== undefined) {
        const newSections = [...activePage.sections];
        newSections[repairAction.sectionIdx].content = result.content;
        updates.sections = newSections;
      }

      updateDocumentNonBlocking(pageRef, updates);

      // Log AI repair activity
      updateDocumentNonBlocking(projectRef, {
        refreshLogs: arrayUnion({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          pageSlug: activePage.slug,
          ruleTriggered: 'Manual Optimization',
          actionTaken: `AI_REPAIR_${repairAction.type}`
        })
      });

      toast({ title: "AI Repair Applied", description: `Successfully applied AI repair: ${repairAction.type}` });
      setActivePage({ ...activePage, ...updates });
    } catch (e: any) {
      toast({ title: "AI Service Error", description: e.message, variant: "destructive" });
    } finally {
      setFixing(null);
      setRepairAction(null);
    }
  };

  const filteredPages = pages?.filter(p => 
    p.seoTitle.toLowerCase().includes(filter.toLowerCase()) || 
    p.type.toLowerCase().includes(filter.toLowerCase()) ||
    (filter.toLowerCase() === 'stale' && p.isStale) ||
    (filter.toLowerCase() === 'broken' && p.qaStatus === 'NEEDS_FIX')
  ) || [];

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search pages or 'stale'/'broken'..." 
            className="pl-9 rounded-xl"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           {stalePages.length > 0 && (
             <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-3 py-1">
               {stalePages.length} STALE
             </Badge>
           )}
           <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-200">
             HEALTHY: {pages?.filter(p => p.qaStatus === 'OK').length}
           </Badge>
        </div>
      </div>

      <div className="rounded-[2rem] border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4 pl-6">Title & Type</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Audit Status</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Score</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.map((page) => (
              <TableRow key={page.id} className={`group hover:bg-slate-50/50 ${page.isStale ? 'bg-amber-50/10' : ''}`}>
                <TableCell className="py-4 pl-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm truncate max-w-[300px]">{page.seoTitle.split('|')[0]}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight opacity-60">{page.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusChip status={page.qaStatus || 'Draft'} />
                    {page.isStale && <Badge className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-200">STALE</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${page.contentScore >= 80 ? 'bg-green-500' : page.contentScore >= 50 ? 'bg-amber-500' : 'bg-destructive'}`} 
                        style={{ width: `${page.contentScore || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black">{page.contentScore || 0}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleRunQA(page)}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 font-bold rounded-lg" onClick={() => setActivePage(page)}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[90%] sm:max-w-[850px] p-0 border-l shadow-2xl">
                        {activePage && (
                          <div className="flex flex-col h-full bg-white">
                            <div className="p-6 border-b bg-slate-50 flex items-center justify-between sticky top-0 z-20">
                              <div className="space-y-1">
                                <h2 className="font-black text-xl tracking-tighter">Feed Auditor</h2>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase">v{activePage.version || 1} | /{activePage.slug}</p>
                              </div>
                              <div className="flex gap-2">
                                {activePage.isStale && (
                                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg" onClick={() => handleApplyBrandUpdates(activePage)} disabled={!!fixing}>
                                    {fixing === activePage.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCcw className="h-3 w-3 mr-1.5" />}
                                    Sync Strategy
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" className="font-bold rounded-lg" onClick={() => handleAutoFix(activePage)} disabled={!!fixing}>
                                  {fixing === activePage.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Hammer className="h-3 w-3 mr-1.5 text-primary" />}
                                  Fix Structural Issues (0 AI)
                                </Button>
                                <a href={`/feed/${project.slug}/${activePage.slug}`} target="_blank">
                                  <Button size="sm" className="font-bold rounded-lg bg-primary text-white">
                                    <ExternalLink className="h-3 w-3 mr-1.5" /> Public View
                                  </Button>
                                </a>
                              </div>
                            </div>
                            
                            <ScrollArea className="flex-1 p-8">
                              {/* QA Auditor Pane */}
                              {activePage.qaIssues && activePage.qaIssues.length > 0 && (
                                <div className="mb-10 p-6 bg-destructive/5 border border-destructive/20 rounded-[2rem] space-y-4">
                                  <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Audit Findings: {activePage.qaIssues.length} issues</h4>
                                  </div>
                                  <div className="grid gap-2">
                                    {activePage.qaIssues.map((issue: any, i: number) => (
                                      <div key={i} className="flex items-center gap-3 text-xs p-3 bg-white/80 rounded-xl border border-destructive/10">
                                        <Badge variant="outline" className={`h-5 text-[8px] font-black uppercase ${issue.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{issue.severity}</Badge>
                                        <p className="font-medium opacity-80">{issue.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="max-w-2xl mx-auto space-y-16 pb-20">
                                <section className="space-y-6 pb-10 border-b relative group">
                                   <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="sm" className="text-[10px] font-black text-primary" onClick={() => {
                                        setRepairAction({ type: 'REWRITE_SEO' });
                                        setShowRepairConfirm(true);
                                      }}>
                                        <Sparkles className="h-3 w-3 mr-1.5" /> Optimize Meta (AI)
                                      </Button>
                                   </div>
                                   <div className="grid gap-4">
                                      <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">Title Tag</label>
                                        <div className="text-sm font-bold bg-slate-50 p-4 rounded-xl border">{activePage.seoTitle}</div>
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">Meta Description</label>
                                        <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border leading-relaxed">{activePage.metaDescription}</div>
                                      </div>
                                   </div>
                                </section>

                                <article className="prose prose-slate max-w-none">
                                  <h1 className="text-4xl font-black mb-12 tracking-tighter leading-tight">{activePage.h1}</h1>
                                  {activePage.sections.map((sec: any, i: number) => (
                                    <div key={i} className="mb-16 relative group rounded-[2rem] transition-colors">
                                      <div className="absolute -top-4 -right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-full shadow-lg border">
                                        <Button variant="ghost" size="sm" className="text-[9px] font-black h-7 rounded-full" onClick={() => {
                                          setRepairAction({ type: 'REWRITE_SECTION', sectionIdx: i });
                                          setShowRepairConfirm(true);
                                        }}>
                                          <Sparkles className="h-3 w-3 mr-1 text-primary" /> REWRITE
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-[9px] font-black h-7 rounded-full" onClick={() => {
                                          setRepairAction({ type: 'SHORTEN_SECTION', sectionIdx: i });
                                          setShowRepairConfirm(true);
                                        }}>
                                          <Scissors className="h-3 w-3 mr-1 text-orange-500" /> SHORTEN
                                        </Button>
                                      </div>
                                      <h2 className="text-2xl font-bold mb-6 text-slate-900">{sec.h2}</h2>
                                      <div className="text-slate-600 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: sec.content }} />
                                    </div>
                                  ))}
                                </article>

                                {activePage.faqs?.length > 0 && (
                                  <section className="pt-12 border-t relative group">
                                     <div className="absolute top-0 right-0 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="text-[10px] font-black text-primary" onClick={() => {
                                          setRepairAction({ type: 'IMPROVE_FAQS' });
                                          setShowRepairConfirm(true);
                                        }}>
                                          <Sparkles className="h-3 w-3 mr-1.5" /> Polish Q&A (AI)
                                        </Button>
                                     </div>
                                     <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" /> Expert Q&A
                                     </h3>
                                     <div className="grid gap-6">
                                        {activePage.faqs.map((f: any, i: number) => (
                                          <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                                            <p className="font-bold text-base mb-3 text-slate-900">{f.question}</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{f.answer}</p>
                                          </div>
                                        ))}
                                     </div>
                                  </section>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showRepairConfirm} onOpenChange={setShowRepairConfirm}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Confirm AI-Assisted Repair
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-4">
              <div className="p-5 bg-muted/50 rounded-2xl border">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Target Action</p>
                <p className="text-sm font-medium text-slate-600">{repairAction?.type.replaceAll('_', ' ')}</p>
              </div>
              <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                <span>Estimated Cost: ~500 Tokens</span>
                <span>Budget Used: {project.aiUsage?.dailyRepairCount || 0} / 5</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground italic border-l-2 pl-4 border-primary/30">
                AI repairs are constrained by your Brand Memory hash. No fake numbers or unauthorized certifications will be introduced.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20" onClick={executeAiRepair}>
              Apply Strategic Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'OK': 'bg-green-500/10 text-green-600 border-green-200',
    'NEEDS_FIX': 'bg-destructive/10 text-destructive border-destructive/20',
    'FIXED': 'bg-blue-500/10 text-blue-600 border-blue-200',
    'Draft': 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${styles[status] || styles['Draft']}`}>
      {status === 'OK' && <CheckCircle className="h-2.5 w-2.5 mr-1" />}
      {status === 'NEEDS_FIX' && <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
      {status}
    </Badge>
  );
}
