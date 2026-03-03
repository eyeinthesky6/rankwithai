
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Save, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { suggestBrandMemory } from "@/ai/flows/suggest-brand-memory-flow";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function BrandMemoryManager({ project }: { project: any }) {
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState(project.brandMemory || {
    companyName: project.name || '',
    services: [],
    industries: [],
    locations: [],
    differentiators: '',
    certifications: '',
    competitors: '',
    tone: 'Professional',
    faqs: []
  });
  const { toast } = useToast();
  const db = useFirestore();

  const isComplete = memory.companyName && memory.services?.length > 0 && memory.differentiators && memory.tone;

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const suggested = await suggestBrandMemory({
        businessName: project.name,
        website: project.website,
        niche: project.niche
      });
      setMemory({ ...suggested, companyName: project.name });
      toast({ title: "Suggestions Ready", description: "Identity core populated with strategic AI insights." });
    } catch (e) {
      toast({ title: "Analysis Failed", description: "Could not generate automated suggestions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'projects', project.id);
      await updateDoc(docRef, {
        brandMemory: memory,
        name: memory.companyName // Sync project name if changed
      });
      toast({ title: "Identity Saved", description: "Brand memory is now locked for generation." });
    } catch (e) {
      toast({ title: "Save Failed", description: "Could not persist identity changes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateList = (field: 'services' | 'industries' | 'locations', value: string, index?: number, remove = false) => {
    const newList = [...(memory[field] || [])];
    if (remove) {
      newList.splice(index!, 1);
    } else if (index !== undefined) {
      newList[index] = value;
    } else {
      newList.push('');
    }
    setMemory({ ...memory, [field]: newList });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {!isComplete && (
            <Badge variant="destructive" className="flex gap-1.5 font-bold rounded-full px-3 py-1">
              <AlertCircle className="h-3.5 w-3.5" /> Identity Incomplete
            </Badge>
          )}
          {isComplete && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200 flex gap-1.5 font-bold rounded-full px-3 py-1">
              Verified Strategy
            </Badge>
          )}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={handleSuggest} variant="outline" className="flex-1 sm:flex-none font-bold rounded-xl" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
            Analyze with AI
          </Button>
          <Button onClick={handleSave} className="flex-1 sm:flex-none font-bold rounded-xl shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Identity
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Company Name</Label>
            <Input 
              value={memory.companyName} 
              onChange={(e) => setMemory({ ...memory, companyName: e.target.value })} 
              placeholder="Official Company Name" 
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
              Services Offered 
              <span className="text-[10px] text-destructive tracking-normal">* Min 1 required</span>
            </Label>
            <ListInput list={memory.services || []} onUpdate={(v, i, r) => updateList('services', v, i, r)} placeholder="e.g. Managed IT Support" />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Target Industries</Label>
            <ListInput list={memory.industries || []} onUpdate={(v, i, r) => updateList('industries', v, i, r)} placeholder="e.g. Healthcare, Finance" />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Service Locations</Label>
            <ListInput list={memory.locations || []} onUpdate={(v, i, r) => updateList('locations', v, i, r)} placeholder="e.g. New York, Remote" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Core Differentiators</Label>
            <Textarea 
              value={memory.differentiators} 
              onChange={(e) => setMemory({ ...memory, differentiators: e.target.value })} 
              placeholder="What makes your B2B solution unique? Avoid generic claims." 
              className="min-h-[120px] rounded-2xl p-4"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Certifications</Label>
              <Input 
                value={memory.certifications} 
                onChange={(e) => setMemory({ ...memory, certifications: e.target.value })} 
                placeholder="ISO, HIPAA, etc." 
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Tone of Voice</Label>
              <Select value={memory.tone} onValueChange={(v) => setMemory({ ...memory, tone: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Conversational">Conversational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Structured FAQs</Label>
              <Button size="sm" variant="ghost" className="font-bold text-primary hover:bg-primary/10" onClick={() => setMemory({ ...memory, faqs: [...(memory.faqs || []), { question: '', answer: '' }] })}>
                <Plus className="h-4 w-4 mr-1" /> Add FAQ
              </Button>
            </div>
            <div className="space-y-4">
              {(memory.faqs || []).map((faq: any, i: number) => (
                <div key={i} className="space-y-3 p-5 bg-muted/40 rounded-2xl relative group border border-transparent hover:border-border/50 transition-all">
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                    const newFaqs = [...memory.faqs];
                    newFaqs.splice(i, 1);
                    setMemory({ ...memory, faqs: newFaqs });
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Input value={faq.question} onChange={(e) => {
                    const newFaqs = [...memory.faqs];
                    newFaqs[i].question = e.target.value;
                    setMemory({ ...memory, faqs: newFaqs });
                  }} placeholder="Question" className="bg-background h-10 rounded-lg border-none focus-visible:ring-1" />
                  <Textarea value={faq.answer} onChange={(e) => {
                    const newFaqs = [...memory.faqs];
                    newFaqs[i].answer = e.target.value;
                    setMemory({ ...memory, faqs: newFaqs });
                  }} placeholder="Answer" className="bg-background min-h-[80px] rounded-lg border-none focus-visible:ring-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListInput({ list, onUpdate, placeholder }: { list: string[], onUpdate: (v: string, i?: number, r?: boolean) => void, placeholder: string }) {
  return (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="flex gap-2 group">
          <Input value={item} onChange={(e) => onUpdate(e.target.value, i)} placeholder={placeholder} className="h-10 rounded-xl" />
          <Button size="icon" variant="ghost" onClick={() => onUpdate('', i, true)} className="shrink-0 text-muted-foreground hover:text-destructive opacity-40 group-hover:opacity-100 transition-opacity">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full border-dashed rounded-xl h-10 font-bold opacity-60 hover:opacity-100" onClick={() => onUpdate('')}>
        <Plus className="h-4 w-4 mr-2" /> Add {placeholder.split(' ').pop()}
      </Button>
    </div>
  );
}
