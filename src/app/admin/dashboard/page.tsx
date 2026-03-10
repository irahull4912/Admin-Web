"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  getDocs, 
  doc,
  query, 
  where,
  orderBy, 
  collectionGroup,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { StatCard } from "../components/stat-card";
import { 
  Users, 
  Package, 
  DollarSign,
  Zap,
  Activity,
  Clock,
  ShieldAlert,
  Store,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Info,
  ClockAlert
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
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";

interface PendingShop {
  id: string;
  name: string;
  ownerName?: string;
  contactEmail: string;
  contactNumber?: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    street: string;
  };
  imageUrl?: string;
  status: string;
  registrationDate: any;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPings, setTotalPings] = useState(0);
  const [pendingShops, setPendingShops] = useState<PendingShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<PendingShop | null>(null);

  const [pingStats, setPingStats] = useState({
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    successful: 0,
    expired: 0,
  });

  useEffect(() => {
    // Real-time listener for pending shops
    const shopsQuery = query(collection(db, "shops"), where("status", "==", "pending"));
    const unsubscribeShops = onSnapshot(shopsQuery, (snapshot) => {
      const shops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingShop[];
      setPendingShops(shops);
    });

    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        const [usersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collectionGroup(db, "products")), 
        ]);

        setTotalUsers(usersSnap.size);
        setTotalProducts(productsSnap.size);

        const pingsSnap = await getDocs(query(collection(db, "pings"), orderBy("createdAt", "desc")));
        
        let revenue = 0;
        const stats = { pending: 0, confirmed: 0, cancelled: 0, successful: 0, expired: 0 };
        
        setTotalPings(pingsSnap.size);

        pingsSnap.forEach(doc => {
          const data = doc.data();
          const amount = data.amount || 0;
          const rawStatus = (data.status || 'pending').toString().toLowerCase().trim();
          
          if (rawStatus === 'pending') {
            stats.pending++;
          } else if (rawStatus === 'confirmed') {
            stats.confirmed++;
          } else if (rawStatus === 'cancelled') {
            stats.cancelled++;
          } else if (rawStatus === 'expired') {
            stats.expired++;
          } else if (rawStatus === 'successful' || rawStatus === 'completed' || rawStatus === 'success') {
            stats.successful++;
            revenue += amount;
          }
        });

        setTotalRevenue(revenue);
        setPingStats(stats);

      } catch (error) {
        // Centralized error listener handles this
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    return () => unsubscribeShops();
  }, []);

  const handleUpdateShopStatus = (shopId: string, newStatus: string) => {
    const docRef = doc(db, "shops", shopId);
    updateDocumentNonBlocking(docRef, { status: newStatus });
    setSelectedShop(null);
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total Revenue" 
          value={loading ? "..." : `$${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+22.5%" 
          trendType="positive"
        />
        <StatCard 
          label="Pending Approvals" 
          value={pendingShops.length.toLocaleString()} 
          icon={ClockAlert} 
          trend={pendingShops.length > 0 ? "Action Required" : "All Clear"}
          trendType={pendingShops.length > 0 ? "negative" : "positive"}
          href="/admin/shops/pending"
        />
        <StatCard 
          label="Total Users" 
          value={loading ? "..." : totalUsers.toLocaleString()} 
          icon={Users} 
          trend="+12%" 
          trendType="positive"
          href="/admin/users"
        />
        <StatCard 
          label="Total Pings" 
          value={loading ? "..." : totalPings.toLocaleString()} 
          icon={Zap} 
          trend="+15%" 
          trendType="positive"
          href="/admin/pings"
        />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {[
          { label: "Successful", value: pingStats.successful, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Zap },
          { label: "Pending", value: pingStats.pending, color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
          { label: "Confirmed", value: pingStats.confirmed, color: "text-blue-500", bg: "bg-blue-500/10", icon: Activity },
          { label: "Cancelled", value: pingStats.cancelled, color: "text-destructive", bg: "bg-destructive/10", icon: Zap },
          { label: "Expired", value: pingStats.expired, color: "text-slate-500", bg: "bg-slate-500/10", icon: ShieldAlert },
        ].map((item, idx) => (
          <Card key={idx} className="border-border/50 bg-card/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-2 rounded-full ${item.bg} mb-2`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <p className="text-2xl font-bold">{loading ? "..." : item.value}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label} Pings</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="border-border bg-card/40 backdrop-blur overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Shop Approvals</CardTitle>
                <CardDescription>Review and manage new merchant registrations.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/shops/pending">View All Pending</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Owner Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingShops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No pending approvals.</TableCell>
                  </TableRow>
                ) : (
                  pendingShops.slice(0, 5).map((shop) => (
                    <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold">{shop.name}</TableCell>
                      <TableCell>{shop.ownerName || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedShop(shop)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Info className="h-4 w-4 mr-1.5" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold">{shop.name}</DialogTitle>
                              <DialogDescription>Review registration details for this merchant.</DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner Name</p>
                                  <p className="font-medium">{shop.ownerName || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registration Email</p>
                                  <div className="flex items-center gap-1.5 font-medium truncate">
                                    <Mail className="h-3.5 w-3.5 text-primary" />
                                    {shop.contactEmail}
                                  </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
                                  <div className="flex items-center gap-1.5 font-medium">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    {shop.location ? `${shop.location.street}, ${shop.location.city}` : "N/A"}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shop Image</p>
                                {shop.imageUrl ? (
                                  <div className="relative aspect-video rounded-md overflow-hidden border">
                                    <Image 
                                      src={shop.imageUrl} 
                                      alt={shop.name} 
                                      fill 
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-24 bg-muted/50 rounded-md flex items-center justify-center border border-dashed">
                                    <p className="text-xs text-muted-foreground italic">No image uploaded</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                              <Button 
                                variant="outline" 
                                onClick={() => handleUpdateShopStatus(shop.id, 'rejected')}
                                className="flex-1 sm:flex-none text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button 
                                onClick={() => handleUpdateStatus(shop.id, 'approved')}
                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
