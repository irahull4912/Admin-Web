
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, Timestamp, collectionGroup } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatCard } from "../components/stat-card";
import { 
  Users, 
  Store, 
  Package, 
  DollarSign,
  Zap,
  LayoutGrid,
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  CreditCard,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

interface PingRecord {
  id: string;
  timestamp: any;
  buyerId: string;
  sellerId: string;
  productId: string;
  status: string;
  senderName: string;
  productName: string;
  amount: number;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentPings, setRecentPings] = useState<PingRecord[]>([]);

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
        console.log("Fetching core dashboard data...");
        
        // Fetch core entities
        // Note: products and shops might be nested, using collectionGroup for products per backend.json
        const [usersSnap, shopsSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "shops")),
          getDocs(collectionGroup(db, "products")), 
        ]);

        console.log(`Core counts - Users: ${usersSnap.size}, Shops: ${shopsSnap.size}, Products: ${productsSnap.size}`);

        setTotalUsers(usersSnap.size);
        setTotalSellers(shopsSnap.size);
        setTotalProducts(productsSnap.size);

        // Build lookup maps for names to avoid nested fetches in the ping loop
        const userMap = new Map();
        usersSnap.forEach(doc => userMap.set(doc.id, doc.data().name || doc.data().email || "Unknown User"));

        const productMap = new Map();
        productsSnap.forEach(doc => productMap.set(doc.id, doc.data().name || "Unknown Product"));

        // Fetch Pings (uncommented as requested)
        try {
          console.log("Fetching pings collection...");
          const pingsQuery = query(collection(db, "pings"), orderBy("timestamp", "desc"), limit(50));
          const pingsSnap = await getDocs(pingsQuery);
          console.log(`Pings found: ${pingsSnap.size}`);
          
          let revenue = 0;
          const pings: PingRecord[] = [];
          const stats = { pending: 0, confirmed: 0, cancelled: 0, successful: 0 };
          
          pingsSnap.forEach(doc => {
            const data = doc.data();
            const amount = data.amount || data.total || data.totalPrice || 0;
            
            const status = (data.status || 'pending').toLowerCase();
            if (status === 'pending') stats.pending++;
            else if (status === 'confirmed') stats.confirmed++;
            else if (status === 'cancelled') stats.cancelled++;
            else if (status === 'successful' || status === 'completed') {
              stats.successful++;
              revenue += amount;
            }

            pings.push({
              id: doc.id,
              timestamp: data.timestamp,
              buyerId: data.buyerId || 'N/A',
              sellerId: data.sellerId || 'N/A',
              productId: data.productId || 'N/A',
              status: data.status || 'Pending',
              senderName: userMap.get(data.buyerId) || "Unknown User",
              productName: productMap.get(data.productId) || "Unknown Product",
              amount: amount
            });
          });

          setTotalRevenue(revenue);
          setPingStats(stats);
          setRecentPings(pings);
        } catch (pingError) {
          console.error("Error fetching pings collection:", pingError);
        }

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
        console.error("General error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatPingDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    try {
      return format(date, "MMM d, h:mm a");
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'successful' || s === 'completed') return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Successful</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
    if (s === 'confirmed') return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Confirmed</Badge>;
    if (s === 'cancelled') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

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

      {/* Recent Pings Table */}
      <Card className="border-border bg-card/40 backdrop-blur overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Pings</CardTitle>
              <CardDescription>Real-time view of latest transactions across the platform.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[180px]">Date & Time</TableHead>
                <TableHead>Sender Name (ID)</TableHead>
                <TableHead>Receiver ID</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 animate-spin" />
                        Loading ping data...
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : recentPings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No recent pings found in 'pings' collection.</TableCell>
                </TableRow>
              ) : (
                recentPings.map((ping) => (
                  <TableRow key={ping.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatPingDate(ping.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{ping.senderName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{ping.buyerId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono">
                      {ping.sellerId}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {ping.productName}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(ping.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </div>
  );
}
