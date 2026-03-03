
import { db } from "@/app/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowRight, ChevronRight, MessageSquare, ShieldCheck, Globe } from "lucide-react";

export async function generateMetadata({ params }: { params: { projectSlug: string, pageSlug: string } }): Promise<Metadata> {
  const { projectSlug, pageSlug } = await params;
  const project = await db.getProjectBySlug(projectSlug);
  if (!project || !project.pages) return {};
  
  const page = project.pages.find((p: any) => p.slug === pageSlug);
  if (!page) return {};

  return {
    title: page.seoTitle,
    description: page.metaDescription,
  };
}

export default async function PublicFeedPage({ params }: { params: { projectSlug: string, pageSlug: string } }) {
  const { projectSlug, pageSlug } = await params;
  const project = await db.getProjectBySlug(projectSlug);

  if (!project || !project.pages) notFound();

  const page = project.pages.find((p: any) => p.slug === pageSlug);
  if (!page) notFound();

  // Structured Data (Schema.org FAQ)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": page.faqs?.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 font-body antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs">RW</div>
            {project.name}
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href={project.website} target="_blank" className="bg-primary text-white px-5 py-2 rounded-full hover:shadow-lg transition-all text-xs font-bold uppercase tracking-wider">
              Visit Official Website
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Breadcrumb / Type */}
        <div className="flex items-center gap-3 mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
            {page.type}
          </span>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <ShieldCheck className="h-3 w-3" />
            Verified Strategic Content
          </div>
        </div>

        {/* Hero Header */}
        <header className="mb-20 space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {page.h1}
          </h1>
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-normal max-w-3xl italic border-l-4 border-primary/20 pl-6">
            {page.metaDescription}
          </p>
        </header>

        {/* Structured Sections */}
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

        {/* Credibility Footer inside content */}
        {project.brandMemory?.certifications && (
          <div className="mt-20 p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Industry Recognition</h4>
              <p className="text-slate-500 text-sm">{project.brandMemory.certifications}</p>
            </div>
          </div>
        )}

        {/* FAQs Section */}
        {page.faqs && page.faqs.length > 0 && (
          <section className="mt-32 pt-16 border-t border-slate-100">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-primary/5 rounded-2xl">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Expert Q&A</h2>
                <p className="text-slate-500 text-sm">Targeted insights for {project.niche} buyers.</p>
              </div>
            </div>
            
            <div className="grid gap-6">
              {page.faqs.map((faq: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-xl transition-all">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Internal Links (Footer Links) */}
        {page.internalLinks && page.internalLinks.length > 0 && (
          <section className="mt-32 pt-16 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Continue Exploring</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {page.internalLinks.map((linkSlug: string) => (
                <a 
                  key={linkSlug} 
                  href={`/feed/${projectSlug}/${linkSlug}`}
                  className="group flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all"
                >
                  <span className="font-bold text-slate-700 group-hover:text-primary transition-colors capitalize">
                    {linkSlug.replace(/-/g, ' ')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="mt-32 bg-primary text-white p-12 rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
          <h2 className="text-4xl font-black tracking-tight relative z-10">Scale Your {project.niche} Strategy</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto relative z-10 leading-relaxed">
            {project.brandMemory?.differentiators}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
            <a href={project.website} target="_blank" className="bg-white text-primary px-12 py-5 rounded-2xl font-black hover:scale-105 transition-transform shadow-lg w-full sm:w-auto">
              Partner with {project.name}
            </a>
            <button className="text-white font-bold hover:underline flex items-center gap-2">
              Speak with a Specialist <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 mt-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="font-bold text-2xl mb-6 tracking-tighter">{project.name}</div>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-10 leading-relaxed font-medium">
            Strategic B2B presence built on technical excellence. Optimized for {project.niche} through the rankwithai engine.
          </p>
          <div className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-10">
            <span>&copy; {new Date().getFullYear()} {project.name}</span>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Strategic Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
