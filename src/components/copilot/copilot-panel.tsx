
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Sparkles, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { copilotChat } from "@/ai/flows/copilot-setup-flow";

export function CopilotPanel({ project, onApplyDraft }: { project?: any, onApplyDraft: (draft: any) => void }) {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! I'm your AI Setup Copilot. Tell me about your business name, niche, and the core services you want to rank for." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const newMessages = [...messages, { role: 'user', content: input } as const];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await copilotChat({ 
        history: newMessages,
        context: { currentProject: project, currentBrandMemory: project?.brandMemory }
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: "I've analyzed your input and prepared a draft proposal. Review the details below." }]);
      setDraft(result);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing that." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-primary">
          <Sparkles className="h-4 w-4" /> Setup Copilot
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
              {m.content}
            </div>
          </div>
        ))}

        {draft && (
          <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-xl space-y-3 mt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-secondary">Draft Proposal</h4>
            <pre className="text-[10px] overflow-auto max-h-32 bg-white/50 p-2 rounded">
              {JSON.stringify(draft, null, 2)}
            </pre>
            <div className="text-[10px] text-muted-foreground italic flex items-start gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" /> {draft.confidenceNotes}
            </div>
            <Button size="sm" className="w-full bg-secondary hover:bg-secondary/90" onClick={() => onApplyDraft(draft)}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Apply to Form
            </Button>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t flex gap-2 bg-muted/30">
        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="e.g. We are a cybersecurity firm for fintech..." 
          className="bg-white"
        />
        <Button size="icon" onClick={handleSend} disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
