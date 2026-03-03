
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ShieldCheck, Copy, Check, Loader2, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, serverTimestamp, query, limit } from "firebase/firestore";
import { verifyDomainDns } from "@/ai/flows/verify-domain-dns";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function CustomDomainManager({ project }: { project: any }) {
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const db = useFirestore();

  const domainQuery = useMemoFirebase(() => query(
    collection(db, 'projects', project.id, 'customDomains'),
    limit(1)
  ), [db, project.id]);

  const { data: domains, isLoading } = useCollection(domainQuery);
  const domain = domains?.[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleAddDomain = async () => {
    if (!domainInput.includes('.') || domainInput.length < 4) {
      toast({ title: "Invalid Domain", description: "Please enter a valid subdomain (e.g., feeds.yourdomain.com)", variant: "destructive" });
      return;
    }

    setLoading(true);
    const id = Math.random().toString(36).substring(7);
    const token = `rankwithai-v1-${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      await setDoc(doc(db, 'projects', project.id, 'customDomains', id), {
        projectId: project.id,
        ownerId: project.ownerId,
        requestedDomain: domainInput,
        status: 'REQUESTED',
        verificationToken: token,
        verificationMethod: 'TXT',
        createdAt: serverTimestamp()
      });
      toast({ title: "Domain Requested", description: "Follow the DNS instructions to verify ownership." });
    } catch (e) {
      toast({ title: "Request Failed", variant: "destructive" });
    } finally {
      setLoading(false);
      setDomainInput('');
    }
  };

  const handleVerify = async () => {
    if (!domain) return;
    setLoading(true);
    
    try {
      const result = await verifyDomainDns({
        domain: domain.requestedDomain,
        token: domain.verificationToken,
        checkType: 'TXT'
      });

      if (result.success) {
        await setDoc(doc(db, 'projects', project.id, 'customDomains', domain.id), {
          status: 'VERIFIED',
          verifiedAt: serverTimestamp(),
          lastError: null
        }, { merge: true });
        toast({ title: "Domain Verified", description: "Ownership confirmed. You can now activate the domain." });
      } else {
        await setDoc(doc(db, 'projects', project.id, 'customDomains', domain.id), {
          lastError: result.error
        }, { merge: true });
        toast({ title: "Verification Failed", description: result.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Verification Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!domain) return;
    setLoading(true);

    try {
      const result = await verifyDomainDns({
        domain: domain.requestedDomain,
        checkType: 'CNAME'
      });

      if (result.success) {
        await setDoc(doc(db, 'projects', project.id, 'customDomains', domain.id), {
          status: 'ACTIVE',
          activatedAt: serverTimestamp(),
          lastError: null
        }, { merge: true });
        toast({ title: "Domain Activated", description: "Your feed is now live on your custom domain." });
      } else {
        await setDoc(doc(db, 'projects', project.id, 'customDomains', domain.id), {
          lastError: result.error
        }, { merge: true });
        toast({ title: "Activation Failed", description: result.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Activation Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!domain) return;
    if (confirm("Remove custom domain? Your feed will no longer be accessible via this URL.")) {
      setLoading(true);
      await deleteDoc(doc(db, 'projects', project.id, 'customDomains', domain.id));
      setLoading(false);
      toast({ title: "Domain Removed" });
    }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {!project.customDomainEnabled && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-black text-amber-700 tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="h-4 w-4" /> Pro Feature
            </h4>
            <p className="text-xs text-amber-600 font-medium">
              Custom Domain support is currently locked. Upgrade your project to white-label your content feeds.
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="outline" className="border-amber-200 text-amber-700 font-bold rounded-xl h-10 w-full sm:w-auto">
              View Pricing & Upgrade
            </Button>
          </Link>
        </div>
      )}

      {!domain ? (
        <Card className="rounded-[2.5rem] border-dashed border-border/60 bg-transparent overflow-hidden shadow-none">
          <CardHeader className="text-center pt-12 pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-4 shadow-inner">
              <Globe className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">White-Label Your Feed</CardTitle>
            <CardDescription className="max-w-xs mx-auto text-balance font-medium">
              Host your AI content on a custom subdomain like <strong>feeds.yourcompany.com</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12 px-12">
            <div className="max-w-sm mx-auto flex flex-col gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-1">Requested Subdomain</Label>
                <Input 
                  placeholder="feeds.yourdomain.com" 
                  value={domainInput} 
                  onChange={(e) => setDomainInput(e.target.value)}
                  disabled={!project.customDomainEnabled || loading}
                  className="h-12 rounded-xl text-center shadow-sm"
                />
              </div>
              <Button 
                onClick={handleAddDomain} 
                disabled={!project.customDomainEnabled || loading || !domainInput}
                className="h-12 font-black rounded-xl shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Configure Custom Domain"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> {domain.requestedDomain}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Deployment Registry</CardDescription>
                </div>
                <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] ${
                  domain.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 border-green-200 shadow-sm' :
                  domain.status === 'VERIFIED' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                  'bg-amber-500/10 text-amber-600 border-amber-200'
                }`}>
                  {domain.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="p-5 bg-muted/40 rounded-3xl space-y-4 border border-transparent hover:border-border/50 transition-all">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Step 1: Ownership Verification</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-col gap-1.5 p-4 bg-background rounded-2xl border border-border/50 shadow-sm">
                      <span className="text-[9px] font-black opacity-50 uppercase">TXT HOST</span>
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                        <span className="truncate">_aifeed-verify.{domain.requestedDomain.split('.')[0]}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleCopy(`_aifeed-verify.${domain.requestedDomain.split('.')[0]}`, 'Host')}><Copy className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 bg-background rounded-2xl border border-border/50 shadow-sm">
                      <span className="text-[9px] font-black opacity-50 uppercase">VALUE</span>
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                        <span className="truncate pr-4">{domain.verificationToken}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleCopy(domain.verificationToken, 'Token')}><Copy className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full font-bold rounded-xl h-11 shadow-sm" 
                    variant={domain.status === 'REQUESTED' ? 'default' : 'outline'}
                    onClick={handleVerify}
                    disabled={loading || domain.status !== 'REQUESTED'}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify DNS Records"}
                  </Button>
                </div>

                <div className={`p-5 rounded-3xl space-y-4 transition-all duration-500 border ${domain.status === 'REQUESTED' ? 'opacity-40 grayscale pointer-events-none' : 'bg-primary/5 border-primary/10 shadow-inner'}`}>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Step 2: Routing Activation</p>
                  <div className="flex flex-col gap-1.5 p-4 bg-background rounded-2xl border border-primary/20 shadow-sm">
                    <span className="text-[9px] font-black opacity-50 uppercase">CNAME TARGET</span>
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-primary">
                      <span>feeds.rankwithai.com</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-primary" onClick={() => handleCopy('feeds.rankwithai.com', 'CNAME')}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <Button 
                    className="w-full font-black rounded-xl h-11 shadow-lg shadow-primary/20" 
                    onClick={handleActivate}
                    disabled={loading || domain.status !== 'VERIFIED'}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate Custom Domain"}
                  </Button>
                </div>
              </div>

              {domain.lastError && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl flex gap-3 text-destructive animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-[11px] font-bold leading-relaxed">{domain.lastError}</p>
                </div>
              )}

              <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 font-bold h-10 rounded-xl" onClick={handleDelete} disabled={loading}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove Configuration
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
             <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16" />
                <h4 className="text-xl font-black tracking-tight relative z-10">Whitelabel Strategy</h4>
                <ul className="space-y-5 relative z-10">
                   <li className="flex gap-4 items-start">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0 text-xs font-black">01</div>
                      <p className="text-xs opacity-80 leading-relaxed font-medium"><strong>Brand Integrity:</strong> Maintaining your domain name increases trust and conversion rates for B2B leads.</p>
                   </li>
                   <li className="flex gap-4 items-start">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0 text-xs font-black">02</div>
                      <p className="text-xs opacity-80 leading-relaxed font-medium"><strong>SEO Consolidation:</strong> Traffic generated by the AI feed contributes directly to your main domain's search authority.</p>
                   </li>
                   <li className="flex gap-4 items-start">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0 text-xs font-black">03</div>
                      <p className="text-xs opacity-80 leading-relaxed font-medium"><strong>Seamless UX:</strong> Users remain within your ecosystem throughout their entire educational journey.</p>
                   </li>
                </ul>
                <div className="pt-6 border-t border-white/10 flex items-center gap-2 text-[9px] font-mono text-primary/60 uppercase font-black tracking-widest">
                   <ArrowRight className="h-3 w-3" /> Enterprise Whitelabel Standard
                </div>
             </div>

             <div className="p-6 border rounded-[2.5rem] bg-slate-50 space-y-4 shadow-inner">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 px-1">Infrastructure Support</h4>
                <div className="space-y-3">
                   <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                      DNS propagation can take anywhere from 1 to 24 hours depending on your TTL settings. Most records resolve within 30 minutes.
                   </p>
                   <a href="#" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group">
                      DNS Setup Documentation <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                   </a>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
