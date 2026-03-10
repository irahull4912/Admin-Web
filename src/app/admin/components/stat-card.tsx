import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "positive" | "negative";
  className?: string;
  href?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendType, className, href }: StatCardProps) {
  const isPositive = trendType === "positive";
  
  const content = (
    <Card className={cn(
      "overflow-hidden border-border/50 bg-white shadow-sm transition-all duration-300",
      href ? "hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 cursor-pointer group" : "",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div className={cn(
            "h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 transition-all duration-300",
            href ? "group-hover:bg-primary group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20" : ""
          )}>
            <Icon className={cn("h-6 w-6 text-slate-400 transition-colors duration-300", href ? "group-hover:text-white" : "")} />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full",
              isPositive ? "bg-emerald-50 text-emerald-600" : "bg-destructive/5 text-destructive"
            )}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block no-underline">{content}</Link>;
  }

  return content;
}
