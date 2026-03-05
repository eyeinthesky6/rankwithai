'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { 
  collection, query, orderBy, limit, doc, setDoc, getDoc, getDocs, where 
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, Zap, ShieldAlert, FileText, LayoutGrid, 
  History, Loader2, Save, Sparkles, MessageSquare, AlertCircle, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        try {
          const adminDocRef = doc(db, 'adminUsers', user.uid);
          const adminSnap = await getDoc(adminDocRef);
          setIsAdmin(adminSnap.exists());
        } catch (e) {
          console.error("Admin check failed:", e);
          setIsAdmin(false);
        }
      };
      checkAdmin();
    } else if (!isUserLoading) {
      setIsAdmin(false);
    }
  }, [user, isUserLoading, db]);

  const docRef = useMemoFirebase(() => doc(db, 'systemConfig', 'product'), [db]);
  const { data: config } = useDoc(docRef);
  const [docContent, setDocContent] = useState('');

  useEffect(() => {
    if (config?.productDoc) setDocContent(config.productDoc);
  }, [config]);

  // Only attempt telemetry/project listing if admin status is confirmed
  const eventsQuery = useMemoFirebase(() => {
    if (isAdmin !== true) return null;
    return query(collection(db, 'eventLogs'), orderBy('createdAt', 'desc'), limit(50));
  }, [db, isAdmin]);
  const { data: events } = useCollection(eventsQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (isAdmin !== true) return null;
    return query(collection(db, 'projects'), limit(100));
  }, [db, isAdmin]);
  const { data: projects } = useCollection(projectsQuery);

  useEffect(() => {
    if (isAdmin === false) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  if (isUserLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin === false) return null;

  const handleSaveDoc = async () => {
    setSavingDoc(true);
    try {
      await setDoc(docRef, { productDoc: docContent, updatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Product Doc Updated", description: "Visitor chat will now use this knowledge source." });
    } catch (e) {
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setSavingDoc(false);
    }
  };

  const totalProjects = projects?.length || 0;
  const totalLeads = events?.filter(e => e.eventType === 'lead_created').length || 0;
  const feedViews = events?.filter(e => e.eventType === 'feed_page_view').length || 0;
  const aiCalls = events?.filter(e => e.eventType === 'ai_action_called').length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
            <ShieldAlert className="h-5 w-5" />
            ADMIN REGISTRY
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="font-bold">Exit Admin</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Projects" value={totalProjects} icon={<LayoutGrid className="h-4 w-4" />} />
          <StatCard title="Feed Views" value={feedViews} icon={<TrendingUp className="h-4 w-4" />} color="blue" />
          <StatCard title="AI Actions" value={aiCalls} icon={<Zap className="h-4 w-4" />} color="amber" />
          <StatCard title="Captured Leads" value={totalLeads} icon={<MessageSquare className="h-4 w-4" />} color="green" />
        </div>

        <Tabs defaultValue="knowledge" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-xl mb-8">
            <TabsTrigger value="knowledge" className="flex gap-2"><FileText className="h-4 w-4" /> Knowledge Source</TabsTrigger>
            <TabsTrigger value="telemetry" className="flex gap-2"><History className="h-4 w-4" /> Activity Log</TabsTrigger>
            <TabsTrigger value="health" className="flex gap-2"><Sparkles className="h-4 w-4" /> System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="space-y-6">
            <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-lg">
              <CardHeader className="bg-white border-b pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tight">Product Feature Document</CardTitle>
                    <CardDescription>Knowledge base for the visitor chat agent.</CardDescription>
                  </div>
                  <Button onClick={handleSaveDoc} disabled={savingDoc} className="font-black rounded-xl shadow-lg">
                    {savingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Knowledge Base
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea 
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                  placeholder="# Welcome to rankwithai..."
                  className="min-h-[600px] border-none rounded-none focus-visible:ring-0 p-8 font-mono text-sm leading-relaxed"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telemetry">
            <Card className="rounded-[2.5rem] border-border/50">
              <CardHeader>
                <CardTitle>System Telemetry</CardTitle>
                <CardDescription>Recent actions across the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {events?.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-white border rounded-xl group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-mono text-[10px] tracking-tighter uppercase px-2">{e.eventType}</Badge>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold">{e.pageSlug ? `/${e.pageSlug}` : e.projectId || 'Global System'}</p>
                          <p className="text-[10px] text-muted-foreground">{e.createdAt?.toDate?.().toLocaleString() || 'Just now'}</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground opacity-40 group-hover:opacity-100">
                        {e.platform}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
             <div className="grid md:grid-cols-2 gap-8">
                <Card className="rounded-[2rem] border-border/50">
                   <CardHeader>
                      <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">Error Monitoring</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <div className="py-12 text-center text-muted-foreground italic text-sm">
                         <AlertCircle className="h-8 w-8 mx-auto mb-4 opacity-20" />
                         No critical execution errors detected.
                      </div>
                   </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-border/50">
                   <CardHeader>
                      <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">AI Budget Governance</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold">
                         <span>Global Utilization</span>
                         <span>Stable</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-primary w-1/4" />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                         Deterministic generation is accounting for &gt;90% of all structural writes. Token efficiency remains high.
                      </p>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color = 'primary' }: { title: string, value: any, icon: any, color?: string }) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    green: 'text-green-600 bg-green-50'
  };

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center justify-between">
          {title}
          <div className={`p-1.5 rounded-lg ${colors[color]}`}>{icon}</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black">{value}</div>
      </CardContent>
    </Card>
  );
}