
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AdminSidebar } from "./components/sidebar";
import { AdminTopNav } from "./components/top-nav";
import { Loader2 } from "lucide-react";

const SUPER_ADMIN_UID = '6BXkgq9KkCY8ZPBvSbMV6m5OuAV2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If no user and not on login page, go to login
      if (!user) {
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
        setLoading(false);
        return;
      }

      // User is logged in, verify admin status
      try {
        const isAdmin = user.uid === SUPER_ADMIN_UID;
        let isRegisteredAdmin = false;

        if (!isAdmin) {
          const adminDoc = await getDoc(doc(db, "adminUsers", user.uid));
          isRegisteredAdmin = adminDoc.exists();
        }

        if (!isAdmin && !isRegisteredAdmin) {
          // NOT AN ADMIN: Sign out and eject
          await signOut(auth);
          router.push("/");
          return;
        }

        // IS AN ADMIN: Allow if on protected page, redirect if on login
        if (pathname === "/admin/login") {
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Auth Guard Error:", error);
        await signOut(auth);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

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
