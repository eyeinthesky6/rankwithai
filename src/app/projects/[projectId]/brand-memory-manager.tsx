
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { suggestMemoryAction, updateBrandMemoryAction } from "@/app/lib/actions";
import { Sparkles, Save, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

  const isComplete = memory.companyName && memory.services?.length > 0 && memory.differentiators && memory.tone;

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const suggested = await suggestMemoryAction(project.id);
      setMemory({ ...suggested, companyName: project.name });
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isComplete && (
            <Badge variant="destructive" className="flex gap-1">
              <AlertCircle className="h-3 w-3" /> Incomplete Identity
            </Badge>
          )}
          {isComplete && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">Identity Verified</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSuggest} variant="secondary" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest with AI
          </Button>
          <Button onClick={handleSave} variant="default" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Identity
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input 
              value={memory.companyName} 
              onChange={(e) => setMemory({ ...memory, companyName: e.target.value })} 
              placeholder="Official Company Name" 
            />
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between">Services Offered <span className="text-xs text-muted-foreground">(Min 1 required)</span></Label>
            <ListInput list={memory.services || []} onUpdate={(v, i, r) => updateList('services', v, i, r)} placeholder="e.g. Managed IT Support" />
          </div>

          <div className="space-y-2">
            <Label>Target Industries</Label>
            <ListInput list={memory.industries || []} onUpdate={(v, i, r) => updateList('industries', v, i, r)} placeholder="e.g. Healthcare, Finance" />
          </div>

          <div className="space-y-2">
            <Label>Service Locations</Label>
            <ListInput list={memory.locations || []} onUpdate={(v, i, r) => updateList('locations', v, i, r)} placeholder="e.g. New York, Remote" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Core Differentiators (Required)</Label>
            <Textarea 
              value={memory.differentiators} 
              onChange={(e) => setMemory({ ...memory, differentiators: e.target.value })} 
              placeholder="What makes you stand out? No fake stats." 
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Certifications</Label>
              <Input 
                value={memory.certifications} 
                onChange={(e) => setMemory({ ...memory, certifications: e.target.value })} 
                placeholder="ISO, HIPAA, etc." 
              />
            </div>
            <div className="space-y-2">
              <Label>Main Competitors</Label>
              <Input 
                value={memory.competitors} 
                onChange={(e) => setMemory({ ...memory, competitors: e.target.value })} 
                placeholder="List key competitors" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tone of Voice</Label>
            <Select value={memory.tone} onValueChange={(v) => setMemory({ ...memory, tone: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Conversational">Conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label>Structured FAQs</Label>
              <Button size="sm" variant="outline" onClick={() => setMemory({ ...memory, faqs: [...(memory.faqs || []), { question: '', answer: '' }] })}>
                <Plus className="h-3 w-3 mr-1" /> Add FAQ
              </Button>
            </div>
            {(memory.faqs || []).map((faq: any, i: number) => (
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
