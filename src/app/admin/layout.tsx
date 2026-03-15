"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AdminSidebar } from "./components/sidebar";
import { AdminTopNav } from "./components/top-nav";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SUPER_ADMIN_UID = '6BXkgq9KkCY8ZPBvSbMV6m5OuAV2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 1. No User: Direct to login unless already there
      if (!user) {
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

        // Attempt database verification
        if (!isSuperAdmin) {
          const adminDoc = await getDoc(doc(db, "adminUsers", user.uid));
          isRegisteredAdmin = adminDoc.exists();
        }

        // 3. Authorization Check
        if (!isSuperAdmin && !isRegisteredAdmin) {
          // NOT AUTHORIZED: Sign out and eject immediately
          await signOut(auth);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have admin privileges for this portal.",
          });
          router.push("/");
          return;
        }

        // 4. Final Routing: Redirect away from login if authorized
        if (pathname === "/admin/login") {
          router.push("/admin/dashboard");
        }
      } catch (error: any) {
        // Handle database or network errors during verification
        console.error("Route Guard Exception:", error);
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Security Violation",
          description: "An error occurred during verification. Access restricted.",
        });
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router, toast]);

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary/10" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">AdminVault</p>
          <p className="text-xs text-muted-foreground animate-pulse">Verifying Security Credentials...</p>
        </div>
      </div>
    );
  }

  // Render children directly for login page to avoid sidebar/nav
  if (pathname === "/admin/login") {
    return <>{children}</>;
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
