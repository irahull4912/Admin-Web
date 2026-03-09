
"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query, 
  orderBy, 
  limit, 
  Timestamp, 
  collectionGroup 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatCard } from "../components/stat-card";
import { 
  Users, 
  Package, 
  DollarSign,
  Zap,
  Activity,
  Clock,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPings, setTotalPings] = useState(0);
  const [recentPings, setRecentPings] = useState<PingRecord[]>([]);

  // Ping statuses
  const [pingStats, setPingStats] = useState({
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    successful: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // 1. Direct Debug Check for specific document
        try {
          const directPingRef = doc(db, "pings", "yurRTVAC4VmO3nXCXImP");
          const directPingSnap = await getDoc(directPingRef);
          if (directPingSnap.exists()) {
            console.log("DEBUG: Direct Ping Fetch SUCCESS:", directPingSnap.data());
          }
        } catch (debugError) {
          console.error("DEBUG: Direct Ping Fetch Error:", debugError);
        }

        // 2. Fetch core entities
        const [usersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collectionGroup(db, "products")), 
        ]);

        setTotalUsers(usersSnap.size);
        setTotalProducts(productsSnap.size);

        // Build lookup maps
        const userMap = new Map();
        usersSnap.forEach(doc => {
          const data = doc.data();
          userMap.set(doc.id, data.name || data.email || "Unknown User");
        });

        const productMap = new Map();
        productsSnap.forEach(doc => {
          const data = doc.data();
          productMap.set(doc.id, data.name || "Unknown Product");
        });

        // 3. Fetch Pings
        try {
          let pingsSnap;
          try {
            const pingsQuery = query(collection(db, "pings"), orderBy("timestamp", "desc"), limit(50));
            pingsSnap = await getDocs(pingsQuery);
          } catch (e) {
            console.log("Falling back to unindexed fetch for pings");
            pingsSnap = await getDocs(collection(db, "pings"));
          }
          
          let revenue = 0;
          const pings: PingRecord[] = [];
          const stats = { pending: 0, confirmed: 0, cancelled: 0, successful: 0 };
          
          setTotalPings(pingsSnap.size);

          pingsSnap.forEach(doc => {
            const data = doc.data();
            const amount = data.amount || data.total || 0;
            
            // Normalize status for counting
            const rawStatus = (data.status || 'pending').toString().toLowerCase().trim();
            
            if (rawStatus === 'pending') stats.pending++;
            else if (rawStatus === 'confirmed') stats.confirmed++;
            else if (rawStatus === 'cancelled') stats.cancelled++;
            else if (rawStatus === 'successful' || rawStatus === 'completed' || rawStatus === 'success') {
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
              senderName: userMap.get(data.buyerId) || `User (${data.buyerId})`,
              productName: productMap.get(data.productId) || `Product (${data.productId})`,
              amount: amount
            });
          });

          setTotalRevenue(revenue);
          setPingStats(stats);
          setRecentPings(pings);
        } catch (pingError) {
          console.error("Error fetching pings collection:", pingError);
        }

      } catch (error) {
        console.error("General dashboard error:", error);
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
    const s = status.toLowerCase().trim();
    if (s === 'successful' || s === 'completed' || s === 'success') return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Successful</Badge>;
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          label="Total Revenue" 
          value={loading ? "..." : `$${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+22.5%" 
          trendType="positive"
        />
        <StatCard 
          label="Live Products" 
          value={loading ? "..." : totalProducts.toLocaleString()} 
          icon={Package} 
          trend="+8.4%" 
          trendType="positive"
          href="/admin/products"
        />
        <StatCard 
          label="Total Users" 
          value={loading ? "..." : totalUsers.toLocaleString()} 
          icon={Users} 
          trend="+12%" 
          trendType="positive"
          href="/admin/users"
        />
      </div>

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
                    <TableCell colSpan={5} className="h-12 text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ))
              ) : recentPings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell>
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
                        <span className="font-semibold">{ping.senderName}</span>
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
    </div>
  );
}
