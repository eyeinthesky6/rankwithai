
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
import { updateDocumentNonBlocking } from '@/firebase';

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
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-black text-amber-700 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Pro Feature
            </h4>
            <p className="text-xs text-amber-600 font-medium">
              Custom Domain support is currently locked. Upgrade your project to white-label your content feeds.
            </p>
          </div>
          <Button variant="outline" className="border-amber-200 text-amber-700 font-bold rounded-xl" onClick={() => toast({ title: "Pro Tiers coming soon!" })}>
            View Pricing
          </Button>
        </div>
      )}

      {!domain ? (
        <Card className="rounded-[2rem] border-dashed border-border/60 bg-transparent overflow-hidden">
          <CardHeader className="text-center pt-12 pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-4">
              <Globe className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black">White-Label Your Feed</CardTitle>
            <CardDescription className="max-w-xs mx-auto">
              Host your AI content on a custom subdomain like <strong>feeds.yourcompany.com</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12 px-12">
            <div className="max-w-sm mx-auto flex flex-col gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Requested Subdomain</Label>
                <Input 
                  placeholder="feeds.yourdomain.com" 
                  value={domainInput} 
                  onChange={(e) => setDomainInput(e.target.value)}
                  disabled={!project.customDomainEnabled || loading}
                  className="h-12 rounded-xl text-center"
                />
              </div>
              <Button 
                onClick={handleAddDomain} 
                disabled={!project.customDomainEnabled || loading || !domainInput}
                className="h-12 font-black rounded-xl shadow-lg"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Configure Custom Domain"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="rounded-[2rem] border-border/50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> {domain.requestedDomain}
                  </CardTitle>
                  <CardDescription className="text-xs font-bold uppercase">Current Status</CardDescription>
                </div>
                <Badge className={`rounded-full px-3 py-1 font-bold ${
                  domain.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 border-green-200' :
                  domain.status === 'VERIFIED' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                  'bg-amber-500/10 text-amber-600 border-amber-200'
                }`}>
                  {domain.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/40 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step 1: Ownership Verification</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col gap-1 p-3 bg-background rounded-xl border border-border/50">
                      <span className="text-[10px] font-black opacity-50">TXT HOST</span>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span>_aifeed-verify.{domain.requestedDomain.split('.')[0]}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(`_aifeed-verify.${domain.requestedDomain.split('.')[0]}`, 'Host')}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-background rounded-xl border border-border/50">
                      <span className="text-[10px] font-black opacity-50">VALUE</span>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="truncate pr-4">{domain.verificationToken}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(domain.verificationToken, 'Token')}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full font-bold rounded-xl" 
                    variant={domain.status === 'REQUESTED' ? 'default' : 'outline'}
                    onClick={handleVerify}
                    disabled={loading || domain.status !== 'REQUESTED'}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify DNS Records"}
                  </Button>
                </div>

                <div className={`p-4 rounded-2xl space-y-3 transition-opacity ${domain.status === 'REQUESTED' ? 'opacity-40 grayscale pointer-events-none' : 'bg-primary/5 border border-primary/10'}`}>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Step 2: Routing Activation</p>
                  <div className="flex flex-col gap-1 p-3 bg-background rounded-xl border border-primary/20">
                    <span className="text-[10px] font-black opacity-50">CNAME TARGET</span>
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-primary">
                      <span>feeds.rankwithai.com</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => handleCopy('feeds.rankwithai.com', 'CNAME')}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <Button 
                    className="w-full font-black rounded-xl shadow-lg" 
                    onClick={handleActivate}
                    disabled={loading || domain.status !== 'VERIFIED'}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate Custom Domain"}
                  </Button>
                </div>
              </div>

              {domain.lastError && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl flex gap-3 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">{domain.lastError}</p>
                </div>
              )}

              <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 font-bold" onClick={handleDelete} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" /> Remove Domain Configuration
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
             <div className="p-8 bg-slate-900 text-white rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-16 -mt-16" />
                <h4 className="text-xl font-black tracking-tight relative z-10">Why use custom domains?</h4>
                <ul className="space-y-4 relative z-10">
                   <li className="flex gap-3 text-sm">
                      <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center text-primary shrink-0">1</div>
                      <p className="opacity-80"><strong>Brand Authority:</strong> Your customers trust your URL more than a third-party subdomain.</p>
                   </li>
                   <li className="flex gap-3 text-sm">
                      <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center text-primary shrink-0">2</div>
                      <p className="opacity-80"><strong>SEO Equity:</strong> Consolidate search traffic and backlink power on your root domain.</p>
                   </li>
                   <li className="flex gap-3 text-sm">
                      <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center text-primary shrink-0">3</div>
                      <p className="opacity-80"><strong>Whitelabel Experience:</strong> Provide a seamless journey for users from your app to the content feed.</p>
                   </li>
                </ul>
                <div className="pt-4 flex items-center gap-2 text-[10px] font-mono text-primary/60 uppercase font-black">
                   <ArrowRight className="h-3 w-3" /> Professional SEO Standard
                </div>
             </div>

             <div className="p-6 border rounded-[2rem] bg-slate-50 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Help & Support</h4>
                <div className="space-y-3">
                   <p className="text-xs text-muted-foreground leading-relaxed">
                      DNS propagation can take anywhere from 1 to 24 hours. Most TXT records resolve within 30 minutes.
                   </p>
                   <a href="#" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      Read DNS Setup Guide <ArrowRight className="h-3 w-3" />
                   </a>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
