
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Loader2, Sparkles, User } from "lucide-react";
import { visitorChat } from "@/ai/flows/visitor-chat-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from 'next/navigation';

export function VisitorChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Don't show in admin dashboard
  if (pathname?.startsWith('/admin')) return null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const result = await visitorChat({
        history: messages,
        message: userMsg
      });
      setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a little trouble connecting. Please try again or visit our docs." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {isOpen ? (
        <div className="w-[350px] h-[500px] bg-background border rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-5 bg-primary text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-black text-sm tracking-tighter">FEED GUIDE</div>
                <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest">rankwithai Support</div>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="rounded-full hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed">
                Hey! I'm the rankwithai Feed Guide. Tell me what you're trying to achieve, and I'll tell you if we can help!
              </div>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-muted rounded-tl-none border border-border/50'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-100" />
                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-muted/30 border-t flex gap-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="How does it work?" 
              className="rounded-xl h-11 border-none bg-background focus-visible:ring-1"
            />
            <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="rounded-xl h-11 w-11 shadow-lg">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="h-16 w-16 rounded-3xl shadow-2xl shadow-primary/40 group hover:scale-105 transition-all"
        >
          <MessageSquare className="h-7 w-7 group-hover:hidden" />
          <Sparkles className="h-7 w-7 hidden group-hover:block animate-pulse" />
        </Button>
      )}
    </div>
  );
}
