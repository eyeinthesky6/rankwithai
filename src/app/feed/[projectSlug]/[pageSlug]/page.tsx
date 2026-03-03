import { db } from "@/app/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({ params }: { params: { projectSlug: string, pageSlug: string } }): Promise<Metadata> {
  const { projectSlug, pageSlug } = await params;
  const project = await db.getProjectBySlug(projectSlug);
  if (!project || !project.pages) return {};
  
  const page = project.pages.find(p => p.pageSlug === pageSlug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.metaDescription,
  };
}

export default async function PublicFeedPage({ params }: { params: { projectSlug: string, pageSlug: string } }) {
  const { projectSlug, pageSlug } = await params;
  const project = await db.getProjectBySlug(projectSlug);

  if (!project || !project.pages) notFound();

  const page = project.pages.find(p => p.pageSlug === pageSlug);
  if (!page) notFound();

  return (
    <div className="bg-white min-h-screen text-slate-900 selection:bg-indigo-100 font-body">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-indigo-900">{project.name}</div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600">Home</a>
            <a href="#" className="hover:text-indigo-600">Services</a>
            <a href="#" className="hover:text-indigo-600">About</a>
            <a href="#" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Contact Us</a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Hero / Header Section */}
        <header className="mb-16">
          <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {page.pageType}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
            {page.title}
          </h1>
          <div className="text-xl text-slate-600 leading-relaxed mb-10 italic border-l-4 border-indigo-200 pl-6">
            {page.metaDescription}
          </div>
        </header>

        {/* Dynamic HTML Content */}
        <article 
          className="prose prose-slate prose-indigo max-w-none 
            prose-headings:text-slate-900 prose-headings:font-bold 
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6
            prose-li:text-slate-700 prose-ul:mb-8
            prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
            prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6"
          dangerouslySetInnerHTML={{ __html: page.htmlContent }}
        />

        {/* FAQs Section */}
        {page.faqJson && page.faqJson.length > 0 && (
          <section className="mt-24 pt-16 border-t border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-10">Frequently Asked Questions</h2>
            <div className="grid gap-8">
              {page.faqJson.map((faq, i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex gap-3">
                    <span className="text-indigo-600 flex-shrink-0">Q.</span>
                    {faq.question}
                  </h3>
                  <div className="text-slate-700 leading-relaxed flex gap-3">
                    <span className="text-slate-400 font-bold flex-shrink-0">A.</span>
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="mt-24 bg-indigo-900 text-white p-12 rounded-3xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to work with {project.name}?</h2>
          <p className="text-indigo-200 mb-10 text-lg max-w-xl mx-auto">
            Contact our specialists today to learn more about our {project.niche} services and how we can help your business thrive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors w-full sm:w-auto">
              Get Started Now
            </button>
            <button className="bg-indigo-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors border border-indigo-700 w-full sm:w-auto flex items-center justify-center gap-2">
              View Services <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="font-bold text-xl mb-6 text-indigo-900">{project.name}</div>
              <p className="text-slate-500 max-w-sm">
                Providing top-tier {project.niche} solutions designed for modern businesses. Built for performance, reliability, and growth.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-indigo-600">Home</a></li>
                <li><a href="#" className="hover:text-indigo-600">Services</a></li>
                <li><a href="#" className="hover:text-indigo-600">Industries</a></li>
                <li><a href="#" className="hover:text-indigo-600">Locations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-indigo-600">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-600">FAQ</a></li>
              </ul>
            </div>
          </div>
          <Separator className="mb-8" />
          <div className="text-center text-slate-400 text-xs">
            &copy; {new Date().getFullYear()} {project.name}. All rights reserved. Generated with AI Feed Engine.
          </div>
        </div>
      </footer>
    </div>
  );
}