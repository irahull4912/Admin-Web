
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatCard } from "../components/stat-card";
import { 
  Users, 
  Store, 
  CreditCard, 
  Clock, 
  ArrowUpRight, 
  TrendingUp,
  BarChart3,
  Activity,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "Jan", users: 1200, revenue: 4500 },
  { month: "Feb", users: 2100, revenue: 5200 },
  { month: "Mar", users: 1800, revenue: 4800 },
  { month: "Apr", users: 2400, revenue: 6100 },
  { month: "May", users: 3100, revenue: 7500 },
  { month: "Jun", users: 2800, revenue: 7200 },
];

const chartConfig = {
  users: {
    label: "Active Users",
    color: "hsl(var(--primary))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--accent))",
  },
};

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const sellersSnapshot = await getDocs(collection(db, "sellers"));
        
        setTotalUsers(usersSnapshot.size);
        setTotalSellers(sellersSnapshot.size);
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Welcome back. Here is what's happening today.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total Users" 
          value={loading ? "..." : totalUsers.toLocaleString()} 
          icon={Users} 
          trend="+12%" 
          trendType="positive"
        />
        <StatCard 
          label="Total Sellers" 
          value={loading ? "..." : totalSellers.toLocaleString()} 
          icon={Store} 
          trend="+5%" 
          trendType="positive"
        />
        <StatCard 
          label="Active Subscriptions" 
          value="4,210" 
          icon={CreditCard} 
          trend="+18%" 
          trendType="positive"
        />
        <StatCard 
          label="Pending Approvals" 
          value="24" 
          icon={Clock} 
          trend="-2%" 
          trendType="negative"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-border bg-card/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Platform Growth</CardTitle>
                <CardDescription>Monthly active users and platform engagement</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-border bg-card/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Latest system-wide events</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { title: "New Seller Approved", time: "2 minutes ago", user: "Gadget World", icon: TrendingUp, color: "text-emerald-500" },
              { title: "Subscription Renewed", time: "15 minutes ago", user: "John Doe", icon: CreditCard, color: "text-primary" },
              { title: "Product Flagged", time: "45 minutes ago", user: "Premium Coffee", icon: Clock, color: "text-destructive" },
              { title: "Payout Processed", time: "1 hour ago", user: "Tech Store", icon: ArrowUpRight, color: "text-accent" },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg bg-muted/50 ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
