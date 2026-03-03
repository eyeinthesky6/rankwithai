'use client';

import { useState } from 'react';
import { Project } from "@/app/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suggestMemoryAction, updateBrandMemoryAction } from "@/app/lib/actions";
import { Sparkles, Save, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BrandMemoryManager({ project }: { project: Project }) {
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState(project.brandMemory || {
    services: [],
    industries: [],
    locations: [],
    differentiators: [],
    tone: '',
    faqs: []
  });
  const { toast } = useToast();

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const suggested = await suggestMemoryAction(project.id);
      setMemory(suggested);
      toast({ title: "Suggestions Generated", description: "Brand memory has been updated with AI suggestions." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate suggestions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateBrandMemoryAction(project.id, memory);
      toast({ title: "Memory Saved", description: "Your brand memory has been updated successfully." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save memory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateList = (field: keyof typeof memory, value: string, index?: number, remove = false) => {
    const newList = [...(memory[field] as any[])];
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
    <div className="space-y-8">
      <div className="flex justify-end gap-2">
        <Button onClick={handleSuggest} variant="secondary" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Suggest with AI
        </Button>
        <Button onClick={handleSave} variant="default" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <SectionTitle title="Services Offered" />
          <ListInput list={memory.services} onUpdate={(v, i, r) => updateList('services', v, i, r)} placeholder="e.g. Managed IT Support" />

          <SectionTitle title="Target Industries" />
          <ListInput list={memory.industries} onUpdate={(v, i, r) => updateList('industries', v, i, r)} placeholder="e.g. Healthcare, Finance" />

          <SectionTitle title="Service Locations" />
          <ListInput list={memory.locations} onUpdate={(v, i, r) => updateList('locations', v, i, r)} placeholder="e.g. New York, Remote" />
        </div>

        <div className="space-y-4">
          <SectionTitle title="Differentiators (USPs)" />
          <ListInput list={memory.differentiators} onUpdate={(v, i, r) => updateList('differentiators', v, i, r)} placeholder="e.g. 24/7 Support with 15m response time" />

          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tone of Voice</Label>
            <Input 
              value={memory.tone} 
              onChange={(e) => setMemory({ ...memory, tone: e.target.value })} 
              placeholder="e.g. Professional, authoritative, yet approachable" 
            />
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">FAQs</Label>
              <Button size="sm" variant="outline" onClick={() => setMemory({ ...memory, faqs: [...memory.faqs, { question: '', answer: '' }] })}>
                <Plus className="h-3 w-3 mr-1" /> Add FAQ
              </Button>
            </div>
            {memory.faqs.map((faq, i) => (
              <div key={i} className="space-y-2 p-3 bg-muted/30 rounded-lg relative group">
                <Button size="icon" variant="ghost" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                  const newFaqs = [...memory.faqs];
                  newFaqs.splice(i, 1);
                  setMemory({ ...memory, faqs: newFaqs });
                }}>
                  <X className="h-3 w-3" />
                </Button>
                <Input value={faq.question} onChange={(e) => {
                  const newFaqs = [...memory.faqs];
                  newFaqs[i].question = e.target.value;
                  setMemory({ ...memory, faqs: newFaqs });
                }} placeholder="Question" className="bg-white" />
                <Textarea value={faq.answer} onChange={(e) => {
                  const newFaqs = [...memory.faqs];
                  newFaqs[i].answer = e.target.value;
                  setMemory({ ...memory, faqs: newFaqs });
                }} placeholder="Answer" className="bg-white min-h-[60px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground block mb-2">{title}</Label>;
}

function ListInput({ list, onUpdate, placeholder }: { list: string[], onUpdate: (v: string, i?: number, r?: boolean) => void, placeholder: string }) {
  return (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={(e) => onUpdate(e.target.value, i)} placeholder={placeholder} />
          <Button size="icon" variant="ghost" onClick={() => onUpdate('', i, true)} className="shrink-0 text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => onUpdate('')}>
        <Plus className="h-4 w-4 mr-1" /> Add Item
      </Button>
    </div>
  );
}
