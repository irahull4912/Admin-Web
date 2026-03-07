
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl relative z-10 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-xl w-fit mb-2 border border-primary/20">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline tracking-tight">AdminVault</CardTitle>
          <CardDescription className="text-muted-foreground">
            Secure access for authorized administrators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full h-12 text-base font-medium flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
