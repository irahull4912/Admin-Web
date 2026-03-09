
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
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
  const content = (
    <Card className={cn(
      "overflow-hidden border-border bg-card/40 backdrop-blur transition-all duration-200",
      href ? "hover:bg-card/60 hover:border-primary/50 cursor-pointer active:scale-[0.98] group" : "",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div className={cn(
            "h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform duration-200",
            href ? "group-hover:scale-110" : ""
          )}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1.5">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              trendType === "positive" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
            )}>
              {trend}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
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
