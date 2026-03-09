
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatCard } from "../components/stat-card";
import { 
  Users, 
  Store, 
  CreditCard, 
  Package, 
  DollarSign,
  Zap,
  LayoutGrid,
  Activity,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

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
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Ping statuses
  const [pingStats, setPingStats] = useState({
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    successful: 0
  });

  // Category stats
  const [categoryStats, setCategoryStats] = useState({
    fashionApparel: 0,
    fashionFootwear: 0,
    kidsApparel: 0,
    kidsFootwear: 0
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Fetch core entities
        const [usersSnap, shopsSnap, productsSnap, pingsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "shops")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "pings"))
        ]);

        setTotalUsers(usersSnap.size);
        setTotalSellers(shopsSnap.size);
        setTotalProducts(productsSnap.size);

        // Calculate Revenue and Ping Statuses from 'pings'
        let revenue = 0;
        const pings = { pending: 0, confirmed: 0, cancelled: 0, successful: 0 };
        
        pingsSnap.forEach(doc => {
          const data = doc.data();
          // Revenue calculation (assuming 'amount' or 'total' field)
          revenue += (data.amount || data.total || 0);
          
          // Status tracking
          const status = data.status?.toLowerCase();
          if (status === 'pending') pings.pending++;
          else if (status === 'confirmed') pings.confirmed++;
          else if (status === 'cancelled') pings.cancelled++;
          else if (status === 'successful' || status === 'completed') pings.successful++;
        });

        setTotalRevenue(revenue);
        setPingStats(pings);

        // Calculate Category Stats from 'products'
        const cats = { fashionApparel: 0, fashionFootwear: 0, kidsApparel: 0, kidsFootwear: 0 };
        productsSnap.forEach(doc => {
          const data = doc.data();
          const category = data.category?.toLowerCase();
          const subcategory = data.subcategory?.toLowerCase();

          if (category === 'fashion') {
            if (subcategory === 'apparel') cats.fashionApparel++;
            if (subcategory === 'footwear') cats.fashionFootwear++;
          } else if (category === 'kids') {
            if (subcategory === 'apparel') cats.kidsApparel++;
            if (subcategory === 'footwear') cats.kidsFootwear++;
          }
        });
        setCategoryStats(cats);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">Comprehensive platform metrics and real-time performance tracking.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border w-fit">
          <div className="px-3 py-1 bg-background rounded-md shadow-sm text-sm font-medium">Real-time</div>
          <div className="px-3 py-1 text-sm text-muted-foreground">Historical</div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total Revenue" 
          value={loading ? "..." : `$${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+22.5%" 
          trendType="positive"
        />
        <StatCard 
          label="Total Users" 
          value={loading ? "..." : totalUsers.toLocaleString()} 
          icon={Users} 
          trend="+12%" 
          trendType="positive"
        />
        <StatCard 
          label="Live Products" 
          value={loading ? "..." : totalProducts.toLocaleString()} 
          icon={Package} 
          trend="+8.4%" 
          trendType="positive"
        />
        <StatCard 
          label="Total Sellers" 
          value={loading ? "..." : totalSellers.toLocaleString()} 
          icon={Store} 
          trend="+5.2%" 
          trendType="positive"
        />
      </div>

      {/* Ping Status Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Successful", value: pingStats.successful, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Pending", value: pingStats.pending, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Confirmed", value: pingStats.confirmed, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Cancelled", value: pingStats.cancelled, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((item, idx) => (
          <Card key={idx} className="border-border/50 bg-card/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-2 rounded-full ${item.bg} mb-2`}>
                <Zap className={`h-4 w-4 ${item.color}`} />
              </div>
              <p className="text-2xl font-bold">{loading ? "..." : item.value}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label} Pings</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Growth Chart */}
        <Card className="md:col-span-4 border-border bg-card/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Platform Growth</CardTitle>
                <CardDescription>Monthly active users and platform revenue</CardDescription>
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
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card className="md:col-span-3 border-border bg-card/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Category Insights</CardTitle>
                <CardDescription>Fashion & Kids distribution</CardDescription>
              </div>
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Fashion
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                    <p className="text-2xl font-bold">{loading ? "..." : categoryStats.fashionApparel}</p>
                    <p className="text-xs text-muted-foreground">Apparel</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                    <p className="text-2xl font-bold">{loading ? "..." : categoryStats.fashionFootwear}</p>
                    <p className="text-xs text-muted-foreground">Footwear</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Kids
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                    <p className="text-2xl font-bold">{loading ? "..." : categoryStats.kidsApparel}</p>
                    <p className="text-xs text-muted-foreground">Apparel</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                    <p className="text-2xl font-bold">{loading ? "..." : categoryStats.kidsFootwear}</p>
                    <p className="text-xs text-muted-foreground">Footwear</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border bg-card/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Latest system-wide events and transactions</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "New Seller Approved", time: "2 minutes ago", detail: "Gadget World", icon: TrendingUp, color: "text-emerald-500" },
              { title: "Subscription Renewed", time: "15 minutes ago", detail: "Premium User #129", icon: CreditCard, color: "text-primary" },
              { title: "High Value Order", time: "45 minutes ago", detail: "Transaction $1,200", icon: DollarSign, color: "text-accent" },
              { title: "System Health", time: "All OK", detail: "Latency: 45ms", icon: Clock, color: "text-muted-foreground" },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg bg-muted/50 ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-bold">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
