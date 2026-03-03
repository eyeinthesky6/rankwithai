import { db } from "@/app/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BrainCircuit, Sparkles, Files, Download, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BrandMemoryManager from "./brand-memory-manager";
import FeedGenerator from "./feed-generator";
import PageList from "./page-list";
import { deleteProjectAction } from "@/app/lib/actions";

export default async function ProjectDetails({ params }: { params: { projectId: string } }) {
  const { projectId } = await params;
  const project = await db.getProjectById(projectId);

  if (!project) notFound();

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
          <form action={deleteProjectAction.bind(null, project.id)}>
            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="memory" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" /> Memory
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Generate
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Files className="h-4 w-4" /> Feed
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Memory</CardTitle>
              <CardDescription>
                Define the core identity of the business. This is used as the context for all AI generations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandMemoryManager project={project} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feed Generation</CardTitle>
              <CardDescription>
                Run the AI engine to generate 20-50 optimized pages based on your current Brand Memory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedGenerator project={project} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feed" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generated Feed</CardTitle>
                <CardDescription>
                  View and export the generated pages for this project.
                </CardDescription>
              </div>
              {project.pages && (
                <Button variant="outline" className="flex items-center gap-2 border-secondary text-secondary">
                  <Download className="h-4 w-4" /> Export ZIP
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <PageList project={project} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}