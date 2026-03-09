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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Sellers", href: "/admin/sellers", icon: Store },
  { label: "Pending Shops", href: "/admin/shops/pending", icon: ClockAlert },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Pings", href: "/admin/pings", icon: Zap },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-headline font-bold text-foreground tracking-tight">AdminVault</span>
      </div>

      <div className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </div>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-foreground font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
