'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Search, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  Terminal, 
  LayoutGrid, 
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectHost } from "@/ai/flows/detect-host-flow";
import CustomDomainManager from "./custom-domain-manager";

type HostType = 'Cloudflare' | 'Vercel' | 'Netlify' | 'WordPress' | 'Nginx' | 'Apache' | 'Unknown';

export default function PublishHelper({ project }: { project: any }) {
  const [urlInput, setUrlInput] = useState(project.website || '');
  const [detecting, setDetecting] = useState(false);
  const [detectedHost, setDetectedHost] = useState<HostType | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDetect = async () => {
    if (!urlInput.startsWith('http')) {
      toast({ title: "Invalid URL", description: "Please include http:// or https://", variant: "destructive" });
      return;
    }
    setDetecting(true);
    try {
      const result = await detectHost({ url: urlInput });
      setDetectedHost(result.host as HostType);
      toast({ title: "Host Identified", description: `Detected platform: ${result.host}` });
    } catch (e) {
      toast({ title: "Detection Failed", description: "Defaulting to manual selection.", variant: "destructive" });
      setDetectedHost('Unknown');
    } finally {
      setDetecting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const snippets = {
    Cloudflare: `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Route /feeds to our AI Feed Engine
    if (url.pathname.startsWith('/feeds/')) {
      const target = 'https://feeds.rankwithai.com/feed/${project.slug}' + url.pathname.replace('/feeds', '');
      return fetch(target, request);
    }
    return fetch(request);
  },
};`,
    Vercel: `{
  "rewrites": [
    {
      "source": "/feeds/:match*",
      "destination": "https://feeds.rankwithai.com/feed/${project.slug}/:match*"
    }
  ]
}`,
    Netlify: `/feeds/*  https://feeds.rankwithai.com/feed/${project.slug}/:splat  200`,
    Nginx: `location /feeds/ {
    proxy_pass https://feeds.rankwithai.com/feed/${project.slug}/;
    proxy_set_header Host feeds.rankwithai.com;
    proxy_ssl_server_name on;
    proxy_buffering off;
}`,
    WordPress: `// Add this to your functions.php or a snippet plugin
add_action('init', function() {
    add_rewrite_rule('^feeds/(.*)?', 'index.php?rankwithai_proxy=$matches[1]', 'top');
});
// Note: Requires a proxy plugin like 'Proxy Any URL' for full path mounting.`
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-primary">
              <Search className="h-5 w-5" /> Strategy Helper
            </h3>
            <p className="text-sm text-muted-foreground font-medium">Identify your host to get tailored mounting instructions.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-4 rounded-[2rem] border border-border/50">
          <Input 
            value={urlInput} 
            onChange={(e) => setUrlInput(e.target.value)} 
            placeholder="https://yourwebsite.com" 
            className="bg-background rounded-xl border-none focus-visible:ring-1 h-12"
          />
          <Button onClick={handleDetect} disabled={detecting} className="rounded-xl font-bold px-6 h-12 shadow-lg shadow-primary/10">
            {detecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
            Detect Host
          </Button>
        </div>

        {(detectedHost || detecting) && (
          <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in-95">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-1.5 px-2">Choose Template:</span>
            {(['Cloudflare', 'Vercel', 'Netlify', 'Nginx', 'WordPress'] as HostType[]).map((h) => (
              <Button 
                key={h} 
                variant={detectedHost === h ? "default" : "outline"} 
                size="sm" 
                onClick={() => setDetectedHost(h)}
                className="rounded-full text-[10px] font-black h-7"
              >
                {h}
              </Button>
            ))}
          </div>
        )}
      </section>

      <Tabs defaultValue="subdomain" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-[2rem] mb-8 h-14">
          <TabsTrigger value="subdomain" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Globe className="h-4 w-4 mr-2" /> Subdomain (CNAME)
          </TabsTrigger>
          <TabsTrigger value="proxy" className="rounded-2xl font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <LayoutGrid className="h-4 w-4 mr-2" /> Path Mount (/feeds)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subdomain">
          <CustomDomainManager project={project} />
        </TabsContent>

        <TabsContent value="proxy">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Card className="rounded-[2.5rem] border-border/50 overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-xl font-black tracking-tight">Reverse Proxy Setup</CardTitle>
                  <CardDescription>
                    Mount your feed under <strong>{urlInput || 'yourdomain.com'}/feeds/</strong> using your infrastructure's rewrite rules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="p-6 bg-slate-900 rounded-3xl text-white relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">
                        {detectedHost || 'Select Platform'}
                      </span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => copyToClipboard(snippets[detectedHost as keyof typeof snippets] || '', 'snippet')}
                      >
                        {copied === 'snippet' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <pre className="text-xs font-mono leading-relaxed overflow-x-auto p-2 scrollbar-hide">
                      {snippets[detectedHost as keyof typeof snippets] || '// Select a platform above to generate code snippets'}
                    </pre>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest opacity-60 px-1">Deployment Checklist</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <ChecklistItem label="Rewrites configured" />
                      <ChecklistItem label="Trailing slashes handled" />
                      <ChecklistItem label="Target set to rankwithai" />
                      <ChecklistItem label="SSL handshake verified" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] flex gap-4 shadow-inner">
                <Info className="h-6 w-6 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-black text-primary">Path-Based SEO Strategy</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Mounting under a path (e.g. <code>/feeds</code>) allows your feed to share domain authority with your root site. Ensure your proxy passes the correct <strong>Host</strong> header.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[2.5rem] border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" /> Troubleshooting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <IssueItem 
                    title="Infinite Redirects"
                    desc="Ensure you aren't forcing HTTPS on the proxy target if it's already using it. Check for circular rewrite rules."
                  />
                  <IssueItem 
                    title="404 on Assets"
                    desc="Rankwithai serves relative paths. Your proxy must handle subpath mapping for images and CSS assets correctly."
                  />
                  <IssueItem 
                    title="SSL Errors"
                    desc="Check if your proxy requires a valid certificate from the upstream. Target: feeds.rankwithai.com"
                  />
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full rounded-xl font-bold text-xs h-10">
                      View Advanced Docs <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] space-y-4 shadow-2xl relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                 <h4 className="text-sm font-black uppercase tracking-widest opacity-50">Support</h4>
                 <p className="text-xs leading-relaxed opacity-80 font-medium">
                   Need help with a custom Nginx or Apache config? Our specialists can help with structural implementation.
                 </p>
                 <Button variant="ghost" className="text-primary hover:bg-primary/10 w-full font-bold text-xs p-0 justify-start h-8">
                   Contact Implementation Support <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <div 
      className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${checked ? 'bg-green-500/10 border-green-200 shadow-inner' : 'bg-muted/20 hover:bg-muted/40 border-transparent'}`}
      onClick={() => setChecked(!checked)}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${checked ? 'bg-green-500 text-white scale-110 shadow-lg shadow-green-500/20' : 'border-2 border-slate-300'}`}>
        {checked && <Check className="h-3 w-3" />}
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-wide ${checked ? 'text-green-700' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

function IssueItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-1 p-3 rounded-2xl hover:bg-muted/30 transition-colors">
      <p className="text-xs font-bold flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> {title}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed pl-5.5">{desc}</p>
    </div>
  );
}
