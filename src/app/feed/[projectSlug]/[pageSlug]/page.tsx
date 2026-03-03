
import { db } from "@/app/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowRight, ChevronRight, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="bg-white min-h-screen text-slate-900 font-body antialiased">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs">RW</div>
            {project.name}
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-primary transition-colors">Resources</a>
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href={project.website} target="_blank" className="bg-primary text-white px-5 py-2 rounded-full hover:shadow-lg transition-all text-xs font-bold uppercase tracking-wider">
              Visit Main Site
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Page Identity */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
            {page.type}
          </span>
          <span className="text-slate-300 text-xs">/</span>
          <span className="text-slate-400 text-xs font-medium tracking-tight">Verified Expert Content</span>
        </div>

        {/* Hero Header */}
        <header className="mb-16 space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            {page.h1}
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed font-light max-w-3xl">
            {page.metaDescription}
          </p>
        </header>

        {/* Structured Sections */}
        <div className="space-y-16">
          {page.sections.map((section: any, i: number) => (
            <section key={i} className="prose prose-slate max-w-none">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="text-primary/20 font-mono text-sm">0{i + 1}</span>
                {section.h2}
              </h2>
              <div className="text-slate-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: section.content }} />
            </section>
          ))}
        </div>

        {/* FAQs Section */}
        {page.faqs && page.faqs.length > 0 && (
          <section className="mt-32 pt-16 border-t border-slate-100">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-secondary/10 rounded-2xl">
                <MessageSquare className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Buyer Insights & FAQs</h2>
                <p className="text-slate-500 text-sm">Expert answers to common {project.niche} questions.</p>
              </div>
            </div>
            
            <div className="grid gap-6">
              {page.faqs.map((faq: any, i: number) => (
                <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-primary/20 transition-colors">
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
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Related Expertise</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {page.internalLinks.map((linkSlug: string) => (
                <a 
                  key={linkSlug} 
                  href={`/feed/${projectSlug}/${linkSlug}`}
                  className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-700 group-hover:text-primary transition-colors capitalize">
                    {linkSlug.replace(/-/g, ' ')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="mt-32 bg-slate-900 text-white p-12 rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">Experience {project.name}</h2>
            <p className="text-slate-400 text-lg">
              Our specialists are ready to discuss how our unique approach to {project.niche} can drive your business goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href={project.website} target="_blank" className="bg-primary text-white px-10 py-5 rounded-2xl font-bold hover:bg-primary/90 shadow-xl transition-all w-full sm:w-auto text-center">
                Get Started
              </a>
              <button className="text-slate-300 font-bold hover:text-white flex items-center gap-2 group">
                Contact Strategy Team <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t py-16 mt-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="font-bold text-xl mb-6 text-slate-900">{project.name}</div>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-10 leading-relaxed">
            Leading {project.niche} expertise for forward-thinking B2B companies. Focused on technical excellence and measurable growth.
          </p>
          <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-8">
            <span>&copy; {new Date().getFullYear()} {project.name}</span>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
