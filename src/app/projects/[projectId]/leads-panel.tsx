
'use client';

import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LeadsPanel({ project }: { project: any }) {
  const db = useFirestore();
  const { toast } = useToast();

  const leadsQuery = useMemoFirebase(() => query(
    collection(db, 'projects', project.id, 'leads'),
    orderBy('createdAt', 'desc')
  ), [db, project.id]);

  const { data: leads, isLoading } = useCollection(leadsQuery);

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      const leadRef = doc(db, 'projects', project.id, 'leads', leadId);
      await updateDoc(leadRef, { status: newStatus });
      toast({ title: "Status Updated", description: `Lead marked as ${newStatus}.` });
    } catch (e) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="rounded-[2rem] border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Outcome Tracking
          </CardTitle>
          <CardDescription>Manage leads captured from your generated content feeds.</CardDescription>
        </CardHeader>
        <CardContent>
          {!leads || leads.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed text-muted-foreground italic text-sm">
              No leads captured yet. Your public feed pages include a lead capture form.
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Source Page</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Message</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{lead.name}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {lead.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">/{lead.pageSlug}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs line-clamp-2 italic opacity-70">"{lead.message}"</p>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={lead.status || 'New'} onValueChange={(v) => handleStatusUpdate(lead.id, v)}>
                          <SelectTrigger className="h-8 text-[10px] font-bold w-[120px] rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="New">NEW</SelectItem>
                            <SelectItem value="Contacted">CONTACTED</SelectItem>
                            <SelectItem value="Closed">CLOSED</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right text-[10px] font-mono opacity-60">
                        {lead.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
