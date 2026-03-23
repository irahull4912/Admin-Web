"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  CreditCard, 
  Package, 
  ShieldCheck,
  ChevronRight,
  ClockAlert,
  Zap,
  Activity,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Sellers", href: "/admin/sellers", icon: Store },
  { label: "Pending Shops", href: "/admin/shops/pending", icon: ClockAlert },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
  { label: "Pings", href: "/admin/pings", icon: Zap },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full bg-sidebar flex flex-col border-r border-sidebar-border shadow-xl z-40">
      <div className="p-8 flex items-center gap-4">
        <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-headline font-bold text-sidebar-foreground tracking-tight">AdminVault</span>
      </div>

      <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-2">Main Navigation</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1" 
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-5 w-5 transition-colors duration-300", isActive ? "text-primary-foreground" : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground")} />
                {item.label}
              </div>
              {isActive && <ChevronRight className="h-4 w-4 animate-in slide-in-from-left-2 duration-300" />}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-sidebar-border/50">
        <div className="bg-sidebar-accent/50 rounded-2xl p-4 border border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">System Pulse</p>
            <Activity className="h-3 w-3 text-brand-green animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-brand-green shadow-sm shadow-brand-green/50" />
            <span className="text-xs text-sidebar-foreground font-medium">All systems active</span>
          </div>
        </div>
      </div>
    </div>
  );
}