
'use client';

import { useState } from 'react';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, CheckCircle, AlertTriangle, Hammer, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { validatePageContent } from "@/app/lib/quality-validator";
import { autoFixPage } from "@/app/lib/auto-fixer";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function PreviewScreen({ project }: { project: any }) {
  const [filter, setFilter] = useState('');
  const [activePage, setActivePage] = useState<any>(null);
  const [fixing, setFixing] = useState<string | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const pagesQuery = useMemoFirebase(() => {
    return query(collection(db, 'projects', project.id, 'pages'), orderBy('createdAt', 'desc'));
  }, [db, project.id]);

  const { data: pages, isLoading } = useCollection(pagesQuery);

  const handleRunQA = async (page: any) => {
    const result = validatePageContent(page);
    const pageRef = doc(db, 'projects', project.id, 'pages', page.id);
    
    updateDocumentNonBlocking(pageRef, {
      qaStatus: result.status,
      qaIssues: result.issues,
      contentScore: result.score,
      qaCheckedAt: new Date().toISOString()
    });

    toast({ title: "QA Complete", description: `Found ${result.issues.length} issues. Score: ${result.score}%` });
  };

  const handleAutoFix = async (page: any) => {
    setFixing(page.id);
    try {
      const { fixedPage, summary } = autoFixPage(page, project.brandMemory);
      const pageRef = doc(db, 'projects', project.id, 'pages', page.id);
      
      await updateDoc(pageRef, {
        ...fixedPage,
        lastFixSummary: summary,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Auto-Fix Applied", description: summary });
      if (activePage?.id === page.id) setActivePage(fixedPage);
    } catch (e) {
      toast({ title: "Fix Failed", variant: "destructive" });
    } finally {
      setFixing(null);
    }
  };

  const filteredPages = pages?.filter(p => 
    p.seoTitle.toLowerCase().includes(filter.toLowerCase()) || 
    p.type.toLowerCase().includes(filter.toLowerCase()) ||
    p.qaStatus?.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search pages or status..." 
            className="pl-9 rounded-xl"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-200">OK: {pages?.filter(p => p.qaStatus === 'OK').length}</Badge>
           <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-200">Fix Required: {pages?.filter(p => p.qaStatus === 'NEEDS_FIX').length}</Badge>
        </div>
      </div>

      <div className="rounded-[2rem] border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b">
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4 pl-6">Title & Path</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Status</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Quality Score</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right pr-6">Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.map((page) => (
              <TableRow key={page.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell className="py-4 pl-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm truncate max-w-[300px]">{page.seoTitle.split('|')[0]}</span>
                    <span className="text-[10px] font-mono text-muted-foreground opacity-60">/{page.slug}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusChip status={page.qaStatus || 'Draft'} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${page.contentScore >= 80 ? 'bg-green-500' : page.contentScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${page.contentScore || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold">{page.contentScore || 0}%</span>
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
                      <SheetContent className="w-[90%] sm:max-w-[700px] p-0 border-l shadow-2xl">
                        {activePage && (
                          <div className="flex flex-col h-full">
                            <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                              <div className="space-y-1">
                                <h2 className="font-black text-xl tracking-tighter">Page Preview</h2>
                                <p className="text-[10px] font-mono text-muted-foreground">ID: {activePage.id} | v{activePage.version || 1}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="font-bold rounded-lg" onClick={() => handleAutoFix(activePage)} disabled={fixing === activePage.id}>
                                  {fixing === activePage.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Hammer className="h-3 w-3 mr-1.5 text-primary" />}
                                  Auto-Fix (0 AI)
                                </Button>
                                <a href={`/feed/${project.slug}/${activePage.slug}`} target="_blank">
                                  <Button size="sm" className="font-bold rounded-lg">
                                    <ExternalLink className="h-3 w-3 mr-1.5" /> Public URL
                                  </Button>
                                </a>
                              </div>
                            </div>
                            
                            <ScrollArea className="flex-1 p-8 bg-white">
                              <div className="max-w-2xl mx-auto space-y-10">
                                <div className="space-y-4 border-b pb-8">
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">SEO Title</label>
                                      <div className="text-sm font-bold bg-slate-50 p-3 rounded-lg border">{activePage.seoTitle}</div>
                                   </div>
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">Meta Description</label>
                                      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border">{activePage.metaDescription}</div>
                                   </div>
                                </div>

                                <article className="prose prose-slate max-w-none">
                                  <h1 className="text-3xl font-black mb-6">{activePage.h1}</h1>
                                  {activePage.sections.map((sec: any, i: number) => (
                                    <div key={i} className="mb-10">
                                      <h2 className="text-xl font-bold mb-4">{sec.h2}</h2>
                                      <div className="text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: sec.content }} />
                                    </div>
                                  ))}
                                </article>

                                {activePage.faqs?.length > 0 && (
                                  <section className="pt-10 border-t">
                                     <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        Structured Expert Q&A
                                     </h3>
                                     <div className="space-y-4">
                                        {activePage.faqs.map((f: any, i: number) => (
                                          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="font-bold text-sm mb-2">{f.question}</p>
                                            <p className="text-xs text-slate-600">{f.answer}</p>
                                          </div>
                                        ))}
                                     </div>
                                  </section>
                                )}
                              </div>
                            </ScrollArea>

                            {activePage.qaIssues?.length > 0 && (
                              <div className="p-6 bg-red-50 border-t">
                                <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-3">
                                  <AlertTriangle className="h-4 w-4" /> Structural Audit Issues
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {activePage.qaIssues.map((issue: any, i: number) => (
                                    <div key={i} className="text-[10px] bg-white p-2 rounded-lg border border-red-100 text-red-800">
                                      {issue.message}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'OK': 'bg-green-500/10 text-green-600 border-green-200',
    'NEEDS_FIX': 'bg-amber-500/10 text-amber-600 border-amber-200',
    'FIXED': 'bg-blue-500/10 text-blue-600 border-blue-200',
    'Draft': 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${styles[status] || styles['Draft']}`}>
      {status === 'OK' && <CheckCircle className="h-2.5 w-2.5 mr-1" />}
      {status === 'NEEDS_FIX' && <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
      {status}
    </Badge>
  );
}
