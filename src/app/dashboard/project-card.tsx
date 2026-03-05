'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Briefcase, ChevronRight, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProjectCard({ project }: { project: any }) {
  const db = useFirestore();
  const { user } = useUser();
  const [staleCount, setStaleCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchHealth = async () => {
      // Query restricted to pages owned by the project owner (current user)
      const q = query(
        collection(db, 'projects', project.id, 'pages'), 
        where('ownerId', '==', user.uid),
        limit(50)
      );
      try {
        const snap = await getDocs(q);
        const stale = snap.docs.filter(d => d.data().isStale).length;
        const issues = snap.docs.filter(d => d.data().qaStatus === 'NEEDS_FIX').length;
        setStaleCount(stale);
        setIssueCount(issues);
      } catch (e) {
        console.warn("Health check limited by permissions or missing data", e);
      }
    };
    fetchHealth();
  }, [db, project.id, user?.uid]);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 group rounded-[2rem] border-border/60">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl truncate font-black tracking-tight">{project.name}</CardTitle>
          <div className="flex gap-1">
            {staleCount > 0 && (
              <Badge variant="outline" className="rounded-full bg-amber-500/10 text-amber-600 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" /> {staleCount} STALE
              </Badge>
            )}
            {issueCount > 0 && (
              <Badge variant="outline" className="rounded-full bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-3 w-3 mr-1" /> {issueCount} BROKEN
              </Badge>
            )}
            {!staleCount && !issueCount && project.lastGenerationHash && (
              <Badge variant="default" className="rounded-full px-3 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">
                HEALTHY
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="flex items-center gap-1.5 mt-1 font-mono text-[11px] font-bold opacity-60">
          <Globe className="h-3 w-3" /> {project.website}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          <span>{project.niche}</span>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 pt-4 flex justify-between items-center group-hover:bg-muted/50 transition-colors">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'Just now'}
        </span>
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="sm" className="font-bold rounded-lg group-hover:translate-x-1 transition-transform">
            Manage <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}