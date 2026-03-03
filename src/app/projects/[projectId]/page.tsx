'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Sparkles, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BrandMemoryManager from "./brand-memory-manager";
import FeedGenerator from "./feed-generator";
import PageList from "./page-list";
import RefreshEngine from "./refresh-engine";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { CopilotPanel } from "@/components/copilot/copilot-panel";

export default function ProjectDetails() {
  const { projectId } = useParams() as { projectId: string };
  const db = useFirestore();
  const router = useRouter();

  const projectRef = useMemoFirebase(() => doc(db, 'projects', projectId), [db, projectId]);
  const { data: project, isLoading } = useDoc(projectRef);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteDocumentNonBlocking(projectRef);
      router.push('/');
    }
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Projects
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

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="memory" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="feed">Pages</TabsTrigger>
              <TabsTrigger value="refresh">Refresh</TabsTrigger>
            </TabsList>
            
            <TabsContent value="memory">
              <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Feed Generation</CardTitle>
                  <CardDescription>Batch-processed deterministic page generation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeedGenerator project={project} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="feed">
              <Card>
                <CardHeader>
                  <CardTitle>Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <PageList project={project} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="refresh">
              <Card>
                <CardHeader>
                  <CardTitle>Refresh Engine</CardTitle>
                </CardHeader>
                <CardContent>
                  <RefreshEngine project={project} />
                </CardContent>
              </Card>
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
