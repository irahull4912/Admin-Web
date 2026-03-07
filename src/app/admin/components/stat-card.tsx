
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "positive" | "negative";
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendType, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card/40 backdrop-blur hover:bg-card/60 transition-colors", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
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
}
