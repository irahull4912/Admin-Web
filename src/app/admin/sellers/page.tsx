
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
  Tag,
  Calendar,
  Layers,
  ShieldCheck,
  Building2,
  FileText
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
      return format(d, "MMM d, yyyy HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (s === 'approved' || s === 'active') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none font-bold">Active</Badge>;
    if (s === 'pending') return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none font-bold">Pending</Badge>;
    if (s === 'suspended' || s === 'rejected') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 shadow-none uppercase text-[10px] tracking-widest font-bold">Suspended</Badge>;
    return <Badge variant="outline" className="shadow-none font-bold">{status}</Badge>;
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Merchant Registry</h1>
        <p className="text-muted-foreground mt-1 text-lg">Platform-wide management of all registered shops and their operational health.</p>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted/30 border-b py-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Registered Shops</CardTitle>
              <CardDescription>Comprehensive database of all verified and pending shops.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest">Shop Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Owner / Contact</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Registered</TableHead>
                <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-24 text-muted-foreground font-medium">No shops registered in the system.</TableCell></TableRow>
              ) : (
                shops.map((shop) => (
                  <TableRow key={shop.id} className="hover:bg-muted/10 transition-colors group">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{shop.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{shop.id.slice(0, 12)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{shop.ownerName}</span>
                        <span className="text-xs text-muted-foreground">{shop.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(shop.status)}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-500">{formatDate(shop.createdAt).split(' ')[0]}</TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-9 px-4 gap-2 rounded-xl shadow-sm hover:bg-primary/5 transition-all"><Info className="h-3.5 w-3.5" /> Dossier</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                          <ScrollArea className="h-full max-h-[90vh]">
                            <div className="p-10 space-y-10 pb-16">
                              <DialogHeader>
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-slate-50 px-3 py-1 border-slate-200">UID: {shop.id}</Badge>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-slate-50 px-3 py-1 border-slate-200">SID: {shop.sellerId || "N/A"}</Badge>
                                  </div>
                                  {getStatusBadge(shop.status)}
                                </div>
                                <DialogTitle className="text-4xl font-headline font-black text-slate-900 leading-tight">{shop.name}</DialogTitle>
                                <DialogDescription className="text-lg text-slate-500 font-medium">Master merchant profile and operational audit log.</DialogDescription>
                              </DialogHeader>

                              <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 group">
                                {shop.imageUrl ? (
                                  <Image src={shop.imageUrl} alt={shop.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-300"><Store className="h-20 w-20 opacity-10" /></div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Tag className="h-3.5 w-3.5 text-primary" /> Core Merchant Identity</h4>
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-5 shadow-sm">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Category</p><p className="font-bold text-sm text-slate-900">{shop.category || "General Retail"}</p></div>
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Principal Agent</p><p className="font-bold text-sm text-slate-900">{shop.ownerName}</p></div>
                                      </div>
                                      <div className="pt-4 border-t border-slate-200/50 space-y-4">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Contact Email</p><p className="font-bold text-sm text-primary underline">{shop.contactEmail}</p></div>
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Contact Number</p><p className="font-bold text-sm text-slate-900 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {shop.contactNumber || "N/A"}</p></div>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Zap className="h-3.5 w-3.5 text-amber-500" /> Performance Analytics</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-center shadow-sm">
                                        <p className="text-[8px] font-bold text-emerald-600 uppercase mb-2">Ping Acceptance</p>
                                        <p className="text-3xl font-black text-emerald-700">{shop.pingAcceptanceRate ? `${(shop.pingAcceptanceRate * 100).toFixed(1)}%` : "100%"}</p>
                                      </div>
                                      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 text-center shadow-sm">
                                        <p className="text-[8px] font-bold text-amber-600 uppercase mb-2">User Rating</p>
                                        <div className="flex items-center justify-center gap-1">
                                          <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                                          <p className="text-3xl font-black text-amber-700">{shop.rating?.toFixed(1) || "0.0"}</p>
                                        </div>
                                        <p className="text-[8px] font-bold text-amber-500/80 uppercase mt-1">({shop.reviewCount || 0} reviews)</p>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Temporal Audit</h4>
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex justify-between gap-4 shadow-sm">
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Registration</p><p className="font-bold text-xs text-slate-700">{formatDate(shop.createdAt)}</p></div>
                                      <div className="text-right"><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Last Update</p><p className="font-bold text-xs text-slate-700">{formatDate(shop.updatedAt)}</p></div>
                                    </div>
                                  </section>
                                </div>

                                <div className="space-y-8">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><MapPin className="h-3.5 w-3.5 text-destructive" /> Geographic Dossier</h4>
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Door / No.</p><p className="font-bold text-sm text-slate-900">{shop.doorNo || "N/A"}</p></div>
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Zip Code</p><p className="font-bold text-sm text-slate-900 font-mono tracking-tighter">{shop.zipCode || "N/A"}</p></div>
                                      </div>
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Street Address</p><p className="font-bold text-sm text-slate-900 leading-tight">{shop.street}</p></div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">City</p><p className="font-bold text-sm text-slate-900">{shop.city}</p></div>
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">State</p><p className="font-bold text-sm text-slate-900">{shop.state}</p></div>
                                      </div>
                                      <div className="pt-3 border-t border-slate-200/50 grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Country</p><p className="font-black text-[10px] uppercase text-slate-500 tracking-widest">{shop.country || "India"}</p></div>
                                        <div className="text-right flex items-center justify-end gap-2 text-primary">
                                          <div className="text-right">
                                            <p className="text-[8px] font-mono leading-none opacity-60">LAT: {shop.latitude?.toFixed(4)}</p>
                                            <p className="text-[8px] font-mono leading-none opacity-60">LNG: {shop.longitude?.toFixed(4)}</p>
                                          </div>
                                          <MapPin className="h-4 w-4" />
                                        </div>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Clock className="h-3.5 w-3.5 text-blue-500" /> Operational Policy</h4>
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Operational Hours</p><p className="font-bold text-xs text-slate-700 whitespace-pre-line leading-relaxed">{shop.operationalHours || "Monday - Saturday: 09:00 - 21:00\nSunday: Closed"}</p></div>
                                      <div className="pt-3 border-t border-slate-200/50">
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mb-2">Merchant Policy</p>
                                        <div className="text-xs italic text-slate-500 leading-relaxed font-medium bg-white/50 p-3 rounded-xl border border-dashed border-slate-200">
                                          {shop.storePolicy || "Merchant has not specified custom store policies. Standard platform-wide service agreements apply to all transactions."}
                                        </div>
                                      </div>
                                    </div>
                                  </section>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      
                      {shop.status !== "approved" && shop.status !== "active" ? (
                        <Button size="sm" variant="outline" className="h-9 gap-2 rounded-xl border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 transition-all font-bold text-xs" onClick={() => handleUpdateStatus(shop.id, "approved")}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-9 gap-2 rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all font-bold text-xs" onClick={() => handleUpdateStatus(shop.id, "suspended")}><XCircle className="h-3.5 w-3.5" /> Suspend</Button>
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
