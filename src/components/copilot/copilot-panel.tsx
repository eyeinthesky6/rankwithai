
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Sparkles, Send, CheckCircle2, AlertCircle, Loader2, History } from "lucide-react";
import { copilotChat } from "@/ai/flows/copilot-setup-flow";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

export function CopilotPanel({ project, onApplyDraft }: { project?: any, onApplyDraft: (draft: any) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Load existing session or create new one - with deduplication
  useEffect(() => {
    if (!user || !project?.id || sessionId || isInitializing) return;

    const initializeSession = async () => {
      setIsInitializing(true);
      try {
        const sessionRef = await addDoc(collection(db, 'projects', project.id, 'copilotSessions'), {
          ownerUid: user.uid,
          projectId: project.id,
          status: 'active',
          createdAt: serverTimestamp()
        });
        setSessionId(sessionRef.id);
        setMessages([{ role: 'assistant', content: "Hi! I'm your AI Setup Copilot. Tell me about your business name, niche, and the core services you want to rank for." }]);
      } catch (error) {
        console.error('Failed to initialize copilot session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [user, project?.id, sessionId, isInitializing]);

  const handleSend = async () => {
    if (!input.trim() || loading || !sessionId || !user) return;
    
    const userMessage = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Persist user message
      await addDoc(collection(db, 'projects', project.id, 'copilotSessions', sessionId, 'messages'), {
        ...userMessage,
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      });

      const result = await copilotChat({ 
        history: newMessages,
        context: { currentProject: project, currentBrandMemory: project?.brandMemory }
      });
      
      const assistantContent = "I've analyzed your input and prepared a strategic draft proposal.";
      const assistantMessage = { role: 'assistant' as const, content: assistantContent };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Persist assistant message
      await addDoc(collection(db, 'projects', project.id, 'copilotSessions', sessionId, 'messages'), {
        ...assistantMessage,
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      });

      if (result) {
        setDraft(result);
        setShowPreview(true);
        // Persist draft
        await addDoc(collection(db, 'projects', project.id, 'copilotSessions', sessionId, 'drafts'), {
          draftJson: result,
          confidenceNotes: result.confidenceNotes || '',
          ownerUid: user.uid,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing that." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!draft || !project?.id || !user) return;
    
    try {
      const projectRef = doc(db, 'projects', project.id);
      const updates: any = {};
      
      if (draft.projectDraft) {
        updates.name = draft.projectDraft.name;
        updates.website = draft.projectDraft.website;
        updates.niche = draft.projectDraft.niche;
      }
      
      if (draft.brandMemoryDraft) {
        updates.brandMemory = {
          ...project.brandMemory,
          ...draft.brandMemoryDraft,
          companyName: draft.projectDraft?.name || project.name
        };
      }

      await setDoc(projectRef, updates, { merge: true });
      toast({ title: "Draft Applied", description: "Project profile updated successfully." });
      setDraft(null);
      setShowPreview(false);
      onApplyDraft(draft);
    } catch (e) {
      toast({ title: "Error", description: "Failed to apply draft.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-3xl bg-white shadow-xl overflow-hidden">
      <div className="p-4 border-b bg-primary text-white flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <Sparkles className="h-4 w-4" /> Setup Copilot
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none shadow-md' : 'bg-slate-100 rounded-tl-none border'}`}>
                {m.content}
              </div>
            </div>
          ))}

          {draft && showPreview && (
            <div className="bg-secondary/5 border-2 border-secondary/20 p-5 rounded-2xl space-y-4 mt-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-widest text-secondary">Strategic Proposal</h4>
                <button onClick={() => setShowPreview(false)} className="text-[10px] text-slate-400 hover:text-slate-600 uppercase font-bold">Hide</button>
              </div>
              
              <div className="space-y-3">
                {draft.projectDraft && (
                  <div className="p-3 bg-white rounded-xl border text-[11px] space-y-1">
                    <div className="font-bold border-b pb-1 mb-1">Project Details</div>
                    <div><strong>Name:</strong> {draft.projectDraft.name}</div>
                    <div><strong>Niche:</strong> {draft.projectDraft.niche}</div>
                  </div>
                )}
                {draft.brandMemoryDraft && (
                  <div className="p-3 bg-white rounded-xl border text-[11px] space-y-1">
                    <div className="font-bold border-b pb-1 mb-1">Identity Core</div>
                    <div><strong>Services:</strong> {draft.brandMemoryDraft.services.join(', ')}</div>
                    <div><strong>Tone:</strong> {draft.brandMemoryDraft.tone}</div>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 p-3 rounded-xl text-[10px] text-amber-700 italic flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {draft.confidenceNotes}
              </div>

              <Button onClick={handleApply} className="w-full bg-secondary hover:bg-secondary/90 shadow-lg font-bold">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Apply Identity Draft
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2 bg-slate-50">
        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="e.g. We provide tax services for startups..." 
          className="bg-white rounded-full px-5 h-12 border-slate-200 focus-visible:ring-primary shadow-sm"
          disabled={loading || !sessionId}
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim() || !sessionId} className="h-12 w-12 rounded-full shadow-lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
