'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronLeft, Sparkles, Trash2, ExternalLink, Loader2, LayoutDashboard, Database, FileText, RefreshCw, Users, Eye, Globe, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BrandMemoryManager from "./brand-memory-manager";
import FeedGenerator from "./feed-generator";
import PreviewScreen from "./preview-screen";
import RefreshEngine from "./refresh-engine";
import ProjectDashboard from "./project-dashboard";
import LeadsPanel from "./leads-panel";
import PublishHelper from "./publish-helper";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { CopilotPanel } from "@/components/copilot/copilot-panel";

export default function ProjectDetails() {
  const { projectId } = useParams() as { projectId: string };
  const db = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const projectRef = useMemoFirebase(() => doc(db, 'projects', projectId), [db, projectId]);
  const { data: project, isLoading } = useDoc(projectRef);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteDocumentNonBlocking(projectRef);
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{project.name}</h1>
            <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary">
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
          <p className="text-muted-foreground">{project.niche}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8 bg-muted/50 p-1 rounded-xl overflow-x-auto">
              <TabsTrigger value="dashboard" className="flex gap-2 text-[10px] md:text-xs"><LayoutDashboard className="h-3 w-3" /> Summary</TabsTrigger>
              <TabsTrigger value="memory" className="flex gap-2 text-[10px] md:text-xs"><Database className="h-3 w-3" /> Memory</TabsTrigger>
              <TabsTrigger value="generate" className="flex gap-2 text-[10px] md:text-xs"><Sparkles className="h-3 w-3" /> Generate</TabsTrigger>
              <TabsTrigger value="preview" className="flex gap-2 text-[10px] md:text-xs"><Eye className="h-3 w-3" /> Preview</TabsTrigger>
              <TabsTrigger value="publish" className="flex gap-2 text-[10px] md:text-xs"><Share2 className="h-3 w-3" /> Publish</TabsTrigger>
              <TabsTrigger value="refresh" className="flex gap-2 text-[10px] md:text-xs"><RefreshCw className="h-3 w-3" /> Refresh</TabsTrigger>
              <TabsTrigger value="leads" className="flex gap-2 text-[10px] md:text-xs"><Users className="h-3 w-3" /> Leads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <ProjectDashboard project={project} />
            </TabsContent>

            <TabsContent value="memory">
              <Card className="rounded-[2rem] overflow-hidden border-border/50">
                <CardHeader>
                  <CardTitle>Brand Memory</CardTitle>
                  <CardDescription>Identity context for all AI generations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BrandMemoryManager project={project} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="generate">
              <Card className="rounded-[2rem] overflow-hidden border-border/50">
                <CardHeader>
                  <CardTitle>Feed Generation</CardTitle>
                  <CardDescription>Batch-processed deterministic page generation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeedGenerator project={project} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview">
              <Card className="rounded-[2rem] overflow-hidden border-border/50">
                <CardHeader>
                  <CardTitle>Feed Preview & Structural Audit</CardTitle>
                  <CardDescription>Validate and deterministic-repair your generated feed.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PreviewScreen project={project} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publish">
              <PublishHelper project={project} />
            </TabsContent>

            <TabsContent value="refresh">
              <Card className="rounded-[2rem] overflow-hidden border-border/50">
                <CardHeader>
                  <CardTitle>Refresh Engine</CardTitle>
                </CardHeader>
                <CardContent>
                  <RefreshEngine project={project} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads">
              <LeadsPanel project={project} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI SETUP ASSISTANCE
          </h3>
          <CopilotPanel 
            project={project} 
            onApplyDraft={(draft) => {
              console.log("Applying draft:", draft);
            }} 
          />
        </div>
      </div>
    </div>
  );
}