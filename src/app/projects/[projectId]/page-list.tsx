'use client';

import { useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useFirestore } from "@/firebase";

export default function PageList({ project }: { project: any }) {
  const [filter, setFilter] = useState('');
  const db = useFirestore();
  const { user } = useUser();

  const pagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'projects', project.id, 'pages'), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, project.id, user?.uid]);

  const { data: pages, isLoading } = useCollection(pagesQuery);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground italic">
        No pages generated yet. Go to the "Generate" tab to start.
      </div>
    );
  }

  const filteredPages = pages.filter(p => 
    p.seoTitle.toLowerCase().includes(filter.toLowerCase()) || 
    p.type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter pages..."
          className="pl-8"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[280px]">{page.seoTitle}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[280px]">{page.metaDescription}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                    {page.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded truncate block max-w-[150px]">
                    /{page.slug}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/feed/${project.slug}/${page.slug}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
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