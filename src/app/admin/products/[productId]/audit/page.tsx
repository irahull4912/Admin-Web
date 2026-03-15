"use client";

import { useEffect, useState, useMemo, use } from "react";
import { collection, query, where, getDocs, onSnapshot, Timestamp, collectionGroup } from "firebase/firestore";
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
import { 
  Zap, 
  ArrowLeft, 
  Loader2, 
  Mail, 
  Calendar, 
  Activity, 
  IndianRupee,
  TrendingUp,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { format } from "date-fns";

interface PingRecord {
  id: string;
  createdAt: any;
  buyerId: string;
  status: string;
  amount: number;
  productId?: string;
  items?: { productId: string; price: number }[];
}

interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price?: number;
  sellingPrice?: number;
}

export default function ProductAuditPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const [pings, setPings] = useState<PingRecord[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [buyerEmails, setBuyerEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProductAndPings() {
      try {
        setLoading(true);

        // Fetch Product Info using collectionGroup
        const productsSnap = await getDocs(collectionGroup(db, "products"));
        const productDoc = productsSnap.docs.find(d => d.id === productId);
        let productData: Product | null = null;
        if (productDoc) {
          productData = { id: productDoc.id, ...productDoc.data() } as Product;
          setProduct(productData);
        }

        // Fetch Pings
        const pingsRef = collection(db, "pings");
        const q = query(pingsRef);

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const pingData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as PingRecord))
            .filter(p => p.productId === productId || p.items?.some(i => i.productId === productId));
          
          const sortedPings = pingData.sort((a, b) => {
            const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return timeB - timeA;
          });

          setPings(sortedPings);

          const uniqueBuyerIds = Array.from(new Set(sortedPings.map(p => p.buyerId)));
          if (uniqueBuyerIds.length > 0) {
            const usersSnap = await getDocs(collection(db, "users"));
            const emails: Record<string, string> = {};
            usersSnap.forEach(doc => {
              if (uniqueBuyerIds.includes(doc.id)) {
                emails[doc.id] = doc.data().email || "No Email";
              }
            });
            setBuyerEmails(prev => ({ ...prev, ...emails }));
          }
          setLoading(false);
        }, (error) => {
          console.error("Error in pings listener:", error);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching audit data:", error);
        setLoading(false);
      }
    }

    fetchProductAndPings();
  }, [productId]);

  const filteredPings = useMemo(() => {
    if (!searchTerm) return pings;
    const term = searchTerm.toLowerCase();
    return pings.filter(ping => {
      const email = buyerEmails[ping.buyerId]?.toLowerCase() || "";
      const status = ping.status.toLowerCase();
      const id = ping.id.toLowerCase();
      return email.includes(term) || status.includes(term) || id.includes(term);
    });
  }, [pings, searchTerm, buyerEmails]);

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (['successful', 'completed', 'success'].includes(s)) return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase font-bold text-[10px]">Successful</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase font-bold text-[10px]">Pending</Badge>;
    if (s === 'cancelled') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 uppercase font-bold text-[10px]">Cancelled</Badge>;
    return <Badge variant="outline" className="uppercase font-bold text-[10px]">{status}</Badge>;
  };

  const totalYield = pings.reduce((acc, p) => {
    const s = (p.status || "").toLowerCase().trim();
    if (['successful', 'completed', 'success'].includes(s)) {
      const amount = p.amount || p.items?.find(i => i.productId === productId)?.price || product?.sellingPrice || product?.price || 0;
      return acc + amount;
    }
    return acc;
  }, 0);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Scanning Transaction Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/admin/products"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Audit Ledger</h1>
          </div>
          <p className="text-muted-foreground text-lg">Detailed transaction history for <span className="text-primary font-bold">{product?.name || productId}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by buyer email or status..." 
              className="pl-9 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-brand-red"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Yield (Success Only)</p>
              <IndianRupee className="h-4 w-4 text-primary opacity-50" />
            </div>
            <p className="text-3xl font-black text-slate-900">₹{totalYield.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Volume</p>
              <Zap className="h-4 w-4 text-amber-500 opacity-50" />
            </div>
            <p className="text-3xl font-black text-slate-900">{pings.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Success Rate</p>
              <TrendingUp className="h-4 w-4 text-emerald-500 opacity-50" />
            </div>
            <p className="text-3xl font-black text-slate-900">
              {pings.length > 0 
                ? `${((pings.filter(p => ['successful', 'completed', 'success'].includes(p.status.toLowerCase())).length / pings.length) * 100).toFixed(0)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Asset Status</p>
              <Activity className="h-4 w-4 text-blue-500 opacity-50" />
            </div>
            <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest">Live Inventory</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/50 border-b py-6 px-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Historical Performance Ledger</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Resolved audit trail mapping buyer identities to actual yields ({filteredPings.length} results).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Timestamp</TableHead>
                <TableHead className="py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Buyer Entity (Email)</TableHead>
                <TableHead className="py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Price</TableHead>
                <TableHead className="text-right pr-8 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic font-medium">
                    {searchTerm ? "No transactions matching your search." : "No transaction pings found for this specific asset."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPings.map((ping) => {
                  const displayPrice = ping.amount || ping.items?.find(i => i.productId === productId)?.price || product?.sellingPrice || product?.price || 0;
                  
                  return (
                    <TableRow key={ping.id} className="hover:bg-muted/10 transition-colors group">
                      <TableCell className="pl-8 text-xs font-mono font-medium text-muted-foreground">
                        {ping.createdAt instanceof Timestamp ? format(ping.createdAt.toDate(), "MMM d, yyyy HH:mm") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-primary/50" />
                          <span className="font-bold text-sm text-slate-700">{buyerEmails[ping.buyerId] || "Resolving..."}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-primary text-sm">
                        ₹{displayPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right pr-8">
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
