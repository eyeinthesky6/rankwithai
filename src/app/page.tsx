import Link from 'next/link';
import { db } from './lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Globe, Briefcase, ChevronRight, LayoutGrid, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function Dashboard() {
  const projects = await db.getAllProjects();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">AI Feed Engine (Lite)</h2>
          <p className="text-muted-foreground">Manage your content projects and generated feeds.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/projects/new">
            <Button className="bg-secondary hover:bg-secondary/90 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <Card className="col-span-full border-dashed p-12 text-center bg-transparent">
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <LayoutGrid className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">No projects yet</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Create your first project to start generating AI-optimized content feeds.
              </p>
              <Link href="/projects/new" className="mt-4">
                <Button variant="outline">Get Started</Button>
              </Link>
            </div>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="overflow-hidden transition-all hover:shadow-lg group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl truncate">{project.name}</CardTitle>
                  <Badge variant={project.pages ? "default" : "secondary"} className={project.pages ? "bg-green-100 text-green-800" : ""}>
                    {project.pages ? `${project.pages.length} Pages` : "Draft"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Globe className="h-3 w-3" /> {project.website}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{project.niche}</span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 pt-4 flex justify-between items-center group-hover:bg-muted/50 transition-colors">
                <span className="text-xs text-muted-foreground">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                    Manage <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <div className="mt-12 bg-primary/5 rounded-2xl p-8 border border-primary/10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
            <Zap className="mr-1 h-3.5 w-3.5" />
            Quick Start Tip
          </div>
          <h3 className="text-2xl font-bold">Why AI Feeds?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Generate dozens of high-quality SEO-optimized landing pages, service descriptions, and location-specific content based on your business's "Brand Memory". 
            Export them as clean HTML or host them directly here.
          </p>
        </div>
        <div className="w-full md:w-1/3 aspect-video bg-white rounded-xl shadow-inner border border-muted flex items-center justify-center p-6">
          <div className="text-center">
            <div className="font-mono text-sm text-primary/40 select-none">
              &lt;html&gt;<br/>
              &nbsp;&nbsp;&lt;head&gt;...&lt;/head&gt;<br/>
              &nbsp;&nbsp;&lt;body&gt;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;AI Generated Content<br/>
              &nbsp;&nbsp;&lt;/body&gt;<br/>
              &lt;/html&gt;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}