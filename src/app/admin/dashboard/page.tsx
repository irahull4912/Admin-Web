"use client";

import { useMemo } from "react";
import { 
  collection, 
  query, 
  where,
  orderBy, 
  collectionGroup,
} from "firebase/firestore";
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import { StatCard } from "../components/stat-card";
import { 
  Users, 
  Zap, 
  Activity, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Info, 
  ClockAlert, 
  Mail, 
  IndianRupee,
  Package
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
import { doc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

interface PendingShop {
  id: string;
  name: string;
  ownerName?: string;
  contactEmail: string;
  location?: { city: string; street: string; };
  imageUrl?: string;
  status: string;
}

export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Queries memoized for real-time hooks
  const usersQuery = useMemoFirebase(() => collection(db, "users"), [db]);
  const pingsQuery = useMemoFirebase(() => query(collection(db, "pings"), orderBy("createdAt", "desc")), [db]);
  const pendingShopsQuery = useMemoFirebase(() => query(collection(db, "shops"), where("status", "==", "pending")), [db]);
  const productsQuery = useMemoFirebase(() => collectionGroup(db, "products"), [db]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: pings, isLoading: pingsLoading } = useCollection(pingsQuery);
  const { data: pendingShops, isLoading: pendingShopsLoading } = useCollection(pendingShopsQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  // Derived Statistics
  const stats = useMemo(() => {
    if (!pings) return { successful: 0, pending: 0, confirmed: 0, cancelled: 0, expired: 0, revenue: 0 };
    
    return pings.reduce((acc, ping) => {
      const status = (ping.status || 'pending').toString().toLowerCase().trim();
      if (['successful', 'success', 'completed'].includes(status)) {
        acc.successful++;
        acc.revenue += (ping.amount || 0);
      } else if (status === 'pending') acc.pending++;
      else if (status === 'confirmed') acc.confirmed++;
      else if (status === 'cancelled') acc.cancelled++;
      else if (status === 'expired') acc.expired++;
      return acc;
    }, { successful: 0, pending: 0, confirmed: 0, cancelled: 0, expired: 0, revenue: 0 });
  }, [pings]);

  if (isUserLoading || !user) {
    return null;
  }

  const handleUpdateShopStatus = (shopId: string, newStatus: string) => {
    if (!db) return;
    const docRef = doc(db, "shops", shopId);
    updateDocumentNonBlocking(docRef, { status: newStatus });
  };

  const isGlobalLoading = usersLoading || pingsLoading || pendingShopsLoading || productsLoading;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg font-medium">Comprehensive platform metrics and real-time performance tracking.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total Revenue" 
          value={isGlobalLoading ? "..." : `₹${stats.revenue.toLocaleString()}`} 
          icon={IndianRupee} 
          trend="+22.5%" 
          trendType="positive" 
        />
        <StatCard 
          label="Pending Approvals" 
          value={pendingShopsLoading ? "..." : (pendingShops?.length || 0).toLocaleString()} 
          icon={ClockAlert} 
          trend={(pendingShops?.length || 0) > 0 ? "Action Required" : "All Clear"} 
          trendType={(pendingShops?.length || 0) > 0 ? "negative" : "positive"} 
          href="/admin/shops/pending" 
        />
        <StatCard 
          label="Total Users" 
          value={usersLoading ? "..." : (users?.length || 0).toLocaleString()} 
          icon={Users} 
          trend="+12%" 
          trendType="positive" 
          href="/admin/users" 
        />
        <StatCard 
          label="Total Products" 
          value={productsLoading ? "..." : (products?.length || 0).toLocaleString()} 
          icon={Package} 
          trend="+8%" 
          trendType="positive" 
          href="/admin/products" 
        />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {[
          { label: "Successful", value: stats.successful, color: "text-brand-green", bg: "bg-brand-green/10", icon: Zap },
          { label: "Pending", value: stats.pending, color: "text-brand-orange", bg: "bg-brand-orange/10", icon: Clock },
          { label: "Confirmed", value: stats.confirmed, color: "text-brand-blue", bg: "bg-brand-blue/10", icon: Activity },
          { label: "Cancelled", value: stats.cancelled, color: "text-brand-red", bg: "bg-brand-red/10", icon: Zap },
          { label: "Expired", value: stats.expired, color: "text-slate-500", bg: "bg-slate-500/10", icon: ShieldAlert },
        ].map((item, idx) => (
          <Card key={idx} className="border-border/50 bg-card/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-2 rounded-full ${item.bg} mb-2`}><item.icon className={`h-4 w-4 ${item.color}`} /></div>
              <p className="text-2xl font-bold">{isGlobalLoading ? "..." : item.value}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.label} Pings</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card/40 backdrop-blur overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Shop Approvals</CardTitle>
              <CardDescription>Review and manage new merchant registrations.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="border-brand-blue text-brand-blue hover:bg-brand-blue/10">
              <Link href="/admin/shops/pending">View All Pending</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest">Shop Name</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Owner Name</TableHead>
                <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingShopsLoading ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Loading shops...</TableCell></TableRow>
              ) : !pendingShops || pendingShops.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No pending approvals.</TableCell></TableRow>
              ) : (
                pendingShops.slice(0, 5).map((shop) => (
                  <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-6 font-semibold">{shop.name}</TableCell>
                    <TableCell>{shop.ownerName || "N/A"}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-brand-blue hover:text-brand-blue hover:bg-brand-blue/10">
                            <Info className="h-4 w-4 mr-1.5" />Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader><DialogTitle className="text-2xl font-bold">{shop.name}</DialogTitle><DialogDescription>Review registration details.</DialogDescription></DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Owner</p><p className="font-medium">{shop.ownerName || "N/A"}</p></div>
                              <div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Contact</p><div className="flex items-center gap-1.5 font-medium truncate"><Mail className="h-3.5 w-3.5 text-brand-blue" />{shop.contactEmail}</div></div>
                              <div className="space-y-1 col-span-2"><p className="text-[10px] font-bold text-muted-foreground uppercase">Location</p><div className="flex items-center gap-1.5 font-medium"><MapPin className="h-3.5 w-3.5 text-brand-blue" />{shop.location ? `${shop.location.street}, ${shop.location.city}` : "N/A"}</div></div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Image</p>
                              {shop.imageUrl ? (<div className="relative aspect-video rounded-md overflow-hidden border"><Image src={shop.imageUrl} alt={shop.name} fill className="object-cover" /></div>) : (<div className="h-24 bg-muted/50 rounded-md flex items-center justify-center border border-dashed text-xs italic text-muted-foreground">No image</div>)}
                            </div>
                          </div>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => handleUpdateShopStatus(shop.id, 'rejected')} className="flex-1 sm:flex-none text-brand-red border-brand-red/20 hover:bg-brand-red/10"><XCircle className="h-4 w-4 mr-2" />Reject</Button>
                            <Button onClick={() => handleUpdateShopStatus(shop.id, 'approved')} className="flex-1 sm:flex-none bg-brand-green hover:bg-brand-green/80 text-brand-dark font-bold"><CheckCircle2 className="h-4 w-4 mr-2" />Approve</Button>
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
  );
}
