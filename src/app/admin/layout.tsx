"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { AdminSidebar } from "./components/sidebar";
import { AdminTopNav } from "./components/top-nav";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SUPER_ADMIN_UID = '6BXkgq9KkCY8ZPBvSbMV6m5OuAV2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 1. No User: Direct to login unless already there
      if (!user) {
        setIsAuthorized(false);
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
        setLoading(false);
        return;
      }

      // 2. Verification Block
      try {
        const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
        let isRegisteredAdmin = false;

        // Perform admin verification
        if (!isSuperAdmin) {
          const adminDoc = await getDoc(doc(db, "adminUsers", user.uid));
          isRegisteredAdmin = adminDoc.exists();
        }

        // 3. Authorization Check
        if (!isSuperAdmin && !isRegisteredAdmin) {
          await signOut(auth);
          setIsAuthorized(false);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Admin privileges required for this portal.",
          });
          router.push("/");
          return;
        }

        // 4. Authorized: Finalize state
        setIsAuthorized(true);
        if (pathname === "/admin/login") {
          router.push("/admin/dashboard");
        }
      } catch (error) {
        await signOut(auth);
        setIsAuthorized(false);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, pathname, router, toast]);

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">AdminVault</p>
          <p className="text-xs text-muted-foreground animate-pulse">Security Verification in Progress...</p>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-svh bg-slate-50 overflow-hidden font-body">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopNav />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
          </div>
          
          <div className="max-w-7xl mx-auto space-y-10 relative z-10">
            {children}
          </div>
          
          <footer className="mt-20 py-8 border-t border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} AdminVault Enterprise OS</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Network
              </span>
              <span>v2.4.0-stable</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
