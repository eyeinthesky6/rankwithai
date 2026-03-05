'use client';

import { useAuth, useUser } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Redirect once user is detected
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (e) {
      console.error("Login trigger failed:", e);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col hero-gradient">
      <nav className="h-16 flex items-center px-6 border-b bg-background/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter text-primary">
          <Sparkles className="h-5 w-5" />
          RANKWITHAI
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter">Welcome</CardTitle>
            <CardDescription className="text-base font-medium">
              Sign in with Google to manage your AI search presence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <Button 
              onClick={handleGoogleLogin} 
              disabled={isLoggingIn || isUserLoading}
              className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              {isLoggingIn || isUserLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-bold">Secure Redirect</span>
              </div>
            </div>

            <Link href="/" className="block text-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="inline-block mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
