"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp, getDocs, collectionGroup } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Search, Filter, Loader2, ArrowLeft, ShoppingCart, Store, User as UserIcon, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

interface PingRecord {
  id: string;
  createdAt: any;
  buyerId: string;
  shopId?: string;
  sellerId?: string; 
  items?: { productId: string }[];
  productId?: string; 
  status: string;
  amount: number;
}

interface ResolvedData {
  users: Record<string, string>; // Stores email address
  shops: Record<string, string>;
  products: Record<string, { name: string; price: number }>;
}

export default function PingsManagementPage() {
  const [pings, setPings] = useState<PingRecord[]>([]);
  const [filteredPings, setFilteredPings] = useState<PingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resolvedData, setResolvedData] = useState<ResolvedData>({
    users: {},
    shops: {},
    products: {}
  });

  useEffect(() => {
    async function fetchResolutionData() {
      try {
        const [usersSnap, shopsSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "shops")),
          getDocs(collectionGroup(db, "products"))
        ]);

        const users: Record<string, string> = {};
        usersSnap.forEach(doc => {
          users[doc.id] = doc.data().email || "No Email";
        });

        const shops: Record<string, string> = {};
        shopsSnap.forEach(doc => {
          shops[doc.id] = doc.data().name || "Unknown Shop";
        });

        const products: Record<string, { name: string; price: number }> = {};
        productsSnap.forEach(doc => {
          products[doc.id] = {
            name: doc.data().name || "Unknown Product",
            price: doc.data().price || 0
          };
        });

        setResolvedData({ users, shops, products });
      } catch (error) {
        console.error("Error resolving ping data names:", error);
      }
    }

    fetchResolutionData();

    const q = query(collection(db, "pings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pingData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PingRecord[];
      setPings(pingData);
      setFilteredPings(pingData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const results = pings.filter(ping => {
      const buyerEmail = resolvedData.users[ping.buyerId] || "";
      const shopIdForLookup = ping.shopId || ping.sellerId || "";
      const shopName = resolvedData.shops[shopIdForLookup] || "";
      const effectiveProductId = ping.items?.[0]?.productId || ping.productId || "";
      const productName = resolvedData.products[effectiveProductId]?.name || "";
      const status = ping.status || "";
      const pingId = ping.id || "";
      
      return (
        pingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredPings(results);
  }, [searchTerm, pings, resolvedData]);

  const formatPingDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
    try {
      return format(date, "MMM d, HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (s === 'successful' || s === 'completed' || s === 'success') return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Successful</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
    if (s === 'confirmed') return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Confirmed</Badge>;
    if (s === 'cancelled') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
    if (s === 'expired') return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">Expired</Badge>;
    return <Badge variant="outline">{status || "Unknown"}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Ping Transactions</h1>
          </div>
          <p className="text-muted-foreground text-lg">Detailed audit log resolving buyer email, shop, and product identities.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by email, shop or product..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Total Pings</CardDescription>
            <CardTitle className="text-3xl">{pings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Success Rate</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">
              {pings.length > 0 
                ? `${((pings.filter(p => ['successful', 'completed', 'success'].includes((p.status || "").toLowerCase())).length / pings.length) * 100).toFixed(1)}%`
                : "0%"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Active Volume</CardDescription>
            <CardTitle className="text-3xl">
              {pings.filter(p => p.status === 'pending' || p.status === 'confirmed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Total Value</CardDescription>
            <CardTitle className="text-3xl">
              ${pings.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Master Audit Log</CardTitle>
          </div>
          <CardDescription>Full history of resolved interactions between buyers (by email) and sellers.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Buyer (Email)</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPings.map((ping) => {
                  const buyerEmail = resolvedData.users[ping.buyerId] || "Guest (No Email)";
                  const targetShopId = ping.shopId || ping.sellerId || "";
                  const shopName = resolvedData.shops[targetShopId] || "Unknown Shop";
                  
                  const targetProductId = ping.items?.[0]?.productId || ping.productId || "";
                  const productInfo = resolvedData.products[targetProductId] || { name: "Unknown Item", price: 0 };
                  
                  return (
                    <TableRow key={ping.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {formatPingDate(ping.createdAt)}
                      </TableCell>
                      <TableCell>
                        {buyerEmail !== "Guest (No Email)" && buyerEmail !== "No Email" ? (
                          <Link 
                            href={`/admin/users?search=${encodeURIComponent(buyerEmail)}`} 
                            className="flex items-center gap-2 hover:text-primary transition-colors group"
                          >
                            <Mail className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                            <span className="font-medium truncate max-w-[180px] hover:underline" title={buyerEmail}>{buyerEmail}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="font-medium truncate max-w-[180px]">{buyerEmail}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[120px]">{shopName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-3 w-3 text-primary/60" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm truncate max-w-[150px]">{productInfo.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {targetProductId ? `${targetProductId.slice(0, 8)}...` : "N/A"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        ${(ping.amount || productInfo.price).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(ping.status)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}