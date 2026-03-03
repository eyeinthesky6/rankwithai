
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { useParams, notFound } from "next/navigation";
import { ArrowRight, ChevronRight, MessageSquare, ShieldCheck, Globe, Loader2, Send, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { logEvent } from "@/lib/telemetry";

export default function PublicFeedPage() {
  const { projectSlug, pageSlug } = useParams() as { projectSlug: string, pageSlug: string };
  const db = useFirestore();
  const { toast } = useToast();
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const projectQuery = useMemoFirebase(() => query(
    collection(db, 'projects'),
    where('slug', '==', projectSlug),
    limit(1)
  ), [db, projectSlug]);

  const { data: projects, isLoading: projectLoading } = useCollection(projectQuery);
  const project = projects?.[0];

  const pagesQuery = useMemoFirebase(() => {
    if (!project) return null;
    return query(
      collection(db, 'projects', project.id, 'pages'),
      where('slug', '==', pageSlug),
      limit(1)
    );
  }, [db, project, pageSlug]);

  const { data: pages, isLoading: pageLoading } = useCollection(pagesQuery);
  const page = pages?.[0];

  // Log feed view
  useEffect(() => {
    if (project && page) {
      logEvent('feed_page_view', { 
        projectId: project.id, 
        pageSlug: page.slug,
        meta: { referrer: typeof document !== 'undefined' ? document.referrer : '' }
      });
    }
  }, [project?.id, page?.slug]);

  if (projectLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!project || !page) return notFound();

  // SEO & Structured Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": page.faqs?.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": project.name,
    "url": project.website,
    "description": project.brandMemory?.differentiators
  };

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const leadData = {
      projectId: project.id,
      ownerId: project.ownerId, 
      pageSlug: page.slug,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
      status: 'New',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'projects', project.id, 'leads'), leadData);
      setSubmitted(true);
      logEvent('lead_created', { projectId: project.id, pageSlug: page.slug });
      toast({ title: "Message Received", description: "Our specialists will review your inquiry." });
    } catch (e) {
      toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 font-body antialiased selection:bg-primary/10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs">RW</div>
            {project.name}
          </div>
          <a href={project.website} target="_blank" className="hidden md:flex bg-primary text-white px-5 py-2 rounded-full hover:shadow-lg transition-all text-xs font-bold uppercase tracking-wider">
            Visit Official Website
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
            {page.type}
          </span>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <ShieldCheck className="h-3 w-3" />
            Strategic B2B Content Feed
          </div>
        </div>

        <header className="mb-20 space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {page.h1}
          </h1>
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-normal max-w-3xl border-l-4 border-primary/20 pl-6">
            {page.metaDescription}
          </p>
        </header>

        <div className="space-y-20">
          {page.sections.map((section: any, i: number) => (
            <section key={i} className="group">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 group-hover:text-primary transition-colors">
                {section.h2}
              </h2>
              <div 
                className="text-slate-700 leading-relaxed text-lg prose prose-slate max-w-none" 
                dangerouslySetInnerHTML={{ __html: section.content }} 
              />
            </section>
          ))}
        </div>

        {/* Internal Linking Engine */}
        {page.internalLinks && page.internalLinks.length > 0 && (
          <div className="mt-20 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <ArrowRight className="h-3 w-3" /> RELATED CAPABILITIES
            </h4>
            <div className="flex flex-wrap gap-4">
              {page.internalLinks.map((slug: string) => (
                <a key={slug} href={`/feed/${projectSlug}/${slug}`} className="px-5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-all">
                  {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </a>
              ))}
            </div>
          </div>
        )}

        {page.faqs && page.faqs.length > 0 && (
          <section className="mt-32 pt-16 border-t border-slate-100">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-primary/5 rounded-2xl">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Expert Q&A</h2>
            </div>
            
            <div className="grid gap-6">
              {page.faqs.map((faq: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-xl transition-all">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{faq.question}</h3>
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lead Capture Module */}
        <section className="mt-32 bg-slate-900 text-white rounded-[3rem] overflow-hidden relative shadow-2xl">
          <div className="grid md:grid-cols-2">
            <div className="p-12 md:p-16 space-y-8 bg-slate-800/50">
              <h2 className="text-4xl font-black tracking-tight">Scale Your {project.niche} Presence.</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                {project.brandMemory?.differentiators}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                  <Globe className="h-6 w-6" />
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Trusted Partner<br/><span className="text-white mt-1 inline-block">{project.name}</span>
                </div>
              </div>
            </div>
            
            <div className="p-12 md:p-16">
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in scale-in">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <h3 className="text-2xl font-bold">Strategic Inquiry Logged</h3>
                  <p className="text-slate-400 text-sm">Our {project.niche} specialists will contact you shortly.</p>
                  <Button variant="outline" className="text-white border-slate-700" onClick={() => setSubmitted(false)}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Name</label>
                    <Input name="name" required className="bg-slate-800 border-slate-700 h-12 rounded-xl text-white focus:ring-primary" placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Business Email</label>
                    <Input name="email" type="email" required className="bg-slate-800 border-slate-700 h-12 rounded-xl text-white focus:ring-primary" placeholder="jane@company.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inquiry Details</label>
                    <Textarea name="message" required className="bg-slate-800 border-slate-700 rounded-xl text-white min-h-[100px] focus:ring-primary" placeholder="How can we help you scale?" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full h-14 rounded-xl font-bold text-lg bg-primary hover:bg-primary/90 mt-4">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Speak with a Specialist</>}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-white py-20 mt-32">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-10">
          <div className="font-bold text-2xl tracking-tighter">{project.name}</div>
          <div className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-10">
            <span>&copy; {new Date().getFullYear()} {project.name}</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Strategic Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
