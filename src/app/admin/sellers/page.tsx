
"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  MapPin, 
  Phone, 
  Info,
  User,
  Mail,
  Clock,
  Star,
  Zap,
  Tag
} from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface ShopProfile {
  id: string;
  sellerId?: string;
  name: string;
  ownerName: string;
  category?: string;
  contactEmail: string;
  contactNumber?: string;
  imageUrl?: string;
  doorNo?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  operationalHours?: string;
  storePolicy?: string;
  rating?: number;
  reviewCount?: number;
  pingAcceptanceRate?: number;
  createdAt?: any;
  updatedAt?: any;
}

export default function SellersPage() {
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "shops"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shopData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopProfile[];
      setShops(shopData);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = (shopId: string, newStatus: string) => {
    const docRef = doc(db, "shops", shopId);
    updateDocumentNonBlocking(docRef, { status: newStatus });
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    try {
      return format(d, "MMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (s === 'approved' || s === 'active') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>;
    if (s === 'pending') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
    if (s === 'suspended' || s === 'rejected') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Merchant Registry</h1>
        <p className="text-muted-foreground mt-1 text-lg">Platform-wide management of all registered shops and their operational health.</p>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle>Registered Shops</CardTitle>
          </div>
          <CardDescription>Comprehensive database of all verified and pending shops.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No shops registered yet.</TableCell></TableRow>
              ) : (
                shops.map((shop) => (
                  <TableRow key={shop.id} className="hover:bg-muted/10 transition-colors group">
                    <TableCell className="font-bold">{shop.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{shop.ownerName}</span>
                        <span className="text-xs text-muted-foreground">{shop.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(shop.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(shop.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 gap-1"><Info className="h-3 w-3" /> Dossier</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden">
                          <ScrollArea className="h-full max-h-[90vh]">
                            <div className="p-8 space-y-8 pb-12">
                              <DialogHeader>
                                <div className="flex items-center justify-between mb-4">
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">{shop.id}</Badge>
                                  {getStatusBadge(shop.status)}
                                </div>
                                <DialogTitle className="text-3xl font-bold">{shop.name}</DialogTitle>
                                <DialogDescription>Comprehensive merchant audit log and operational profile.</DialogDescription>
                              </DialogHeader>

                              <div className="relative aspect-video rounded-2xl overflow-hidden border shadow-inner bg-slate-100">
                                {shop.imageUrl ? <Image src={shop.imageUrl} alt={shop.name} fill className="object-cover" /> : <div className="h-full flex items-center justify-center"><Store className="h-12 w-12 opacity-10" /></div>}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                  <section className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Tag className="h-3 w-3" /> Core Data</h4>
                                    <div className="bg-slate-50/50 p-4 rounded-xl border space-y-3">
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Category</p><p className="font-bold text-sm">{shop.category || "General Retail"}</p></div>
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Principal Agent</p><p className="font-bold text-sm">{shop.ownerName}</p></div>
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Contact Email</p><p className="font-semibold text-sm text-primary">{shop.contactEmail}</p></div>
                                    </div>
                                  </section>
                                  <section className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap className="h-3 w-3" /> Performance</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                                        <p className="text-[8px] font-bold text-emerald-600 uppercase">Ping Rate</p>
                                        <p className="text-xl font-black text-emerald-700">{shop.pingAcceptanceRate ? `${(shop.pingAcceptanceRate * 100).toFixed(1)}%` : "100%"}</p>
                                      </div>
                                      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-center">
                                        <p className="text-[8px] font-bold text-amber-600 uppercase">Rating</p>
                                        <p className="text-xl font-black text-amber-700">{shop.rating?.toFixed(1) || "0.0"}</p>
                                      </div>
                                    </div>
                                  </section>
                                </div>
                                <div className="space-y-6">
                                  <section className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="h-3 w-3" /> Location Detail</h4>
                                    <div className="bg-slate-50/50 p-4 rounded-xl border space-y-2 text-sm">
                                      <p className="font-medium">{shop.doorNo}, {shop.street}</p>
                                      <p className="text-slate-600">{shop.city}, {shop.state}, {shop.zipCode}</p>
                                      <p className="text-[10px] font-mono text-muted-foreground pt-1 border-t mt-2 uppercase">{shop.country}</p>
                                    </div>
                                  </section>
                                  <section className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="h-3 w-3" /> Operational Policy</h4>
                                    <div className="bg-slate-50/50 p-4 rounded-xl border text-xs italic text-slate-500 leading-relaxed">
                                      {shop.storePolicy || "Standard merchant policies apply."}
                                    </div>
                                  </section>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      
                      {shop.status !== "approved" && shop.status !== "active" ? (
                        <Button size="sm" variant="outline" className="h-8 gap-1 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleUpdateStatus(shop.id, "approved")}><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 gap-1 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus(shop.id, "suspended")}><XCircle className="h-3 w-3" /> Suspend</Button>
                      )}
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
