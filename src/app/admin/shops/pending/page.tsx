
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, Timestamp } from "firebase/firestore";
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
  DialogFooter, 
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
  ArrowLeft,
  User,
  Mail,
  Clock,
  Star,
  Zap,
  Tag,
  FileText,
  Calendar
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

export default function PendingShopsPage() {
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<ShopProfile | null>(null);

  useEffect(() => {
    const q = query(collection(db, "shops"), where("status", "==", "pending"));
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
    setSelectedShop(null);
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/admin/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Shop Approvals</h1>
          <p className="text-muted-foreground mt-1 text-lg">Detailed merchant dossiers for registration review.</p>
        </div>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur overflow-hidden shadow-xl">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Awaiting Decisions</CardTitle>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20">{shops.length} Pending</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Identity</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">No pending registrations.</TableCell>
                </TableRow>
              ) : (
                shops.map((shop) => (
                  <TableRow key={shop.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-base">{shop.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">{shop.id.slice(0, 12)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{shop.ownerName}</span>
                        <span className="text-xs text-muted-foreground">{shop.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/60" />
                        {shop.city}, {shop.state}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedShop(shop)} className="border-primary/20 text-primary hover:bg-primary/5">
                            <Info className="h-4 w-4 mr-2" /> Inspect Dossier
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl">
                          <ScrollArea className="h-full max-h-[90vh]">
                            <div className="p-8 space-y-8 pb-12">
                              <DialogHeader>
                                <div className="flex items-center justify-between mb-4">
                                  <Badge variant="outline" className="text-[10px] font-mono tracking-widest uppercase px-3 py-1">Merchant ID: {shop.id}</Badge>
                                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase text-[10px] font-bold">Awaiting Approval</Badge>
                                </div>
                                <DialogTitle className="text-4xl font-headline font-black text-slate-900 leading-tight">{shop.name}</DialogTitle>
                                <DialogDescription className="text-base text-slate-500">Comprehensive shop profile and operational audit data.</DialogDescription>
                              </DialogHeader>

                              <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-slate-100">
                                {shop.imageUrl ? (
                                  <Image src={shop.imageUrl} alt={shop.name} fill className="object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-300"><Store className="h-16 w-16 opacity-20" /></div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Tag className="h-3 w-3" /> Core Identity</h4>
                                    <div className="grid gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Category</p><p className="font-bold text-sm">{shop.category || "General Retail"}</p></div>
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Seller Reference</p><p className="font-mono text-xs">{shop.sellerId || "N/A"}</p></div>
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Registration Date</p><p className="font-semibold text-xs">{formatDate(shop.createdAt)}</p></div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><User className="h-3 w-3" /> Ownership & Contact</h4>
                                    <div className="grid gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Principal</p><p className="font-bold text-sm">{shop.ownerName}</p></div>
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Email</p><p className="font-semibold text-sm text-primary underline">{shop.contactEmail}</p></div>
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Phone</p><p className="font-bold text-sm flex items-center gap-1.5"><Phone className="h-3 w-3" /> {shop.contactNumber || "Not Provided"}</p></div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap className="h-3 w-3" /> Performance Metrics</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
                                        <p className="text-[9px] font-bold text-emerald-600 uppercase">Ping Acceptance</p>
                                        <p className="text-2xl font-black text-emerald-700">{shop.pingAcceptanceRate ? `${(shop.pingAcceptanceRate * 100).toFixed(1)}%` : "100%"}</p>
                                      </div>
                                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
                                        <p className="text-[9px] font-bold text-amber-600 uppercase">Avg Rating</p>
                                        <div className="flex items-center justify-center gap-1 text-2xl font-black text-amber-700">
                                          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                          {shop.rating?.toFixed(1) || "0.0"}
                                        </div>
                                        <p className="text-[8px] text-amber-600 uppercase font-bold">({shop.reviewCount || 0} Reviews)</p>
                                      </div>
                                    </div>
                                  </section>
                                </div>

                                <div className="space-y-6">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="h-3 w-3" /> Geographic Footprint</h4>
                                    <div className="grid gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Door / No.</p><p className="font-semibold">{shop.doorNo || "N/A"}</p></div>
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold">ZIP Code</p><p className="font-mono">{shop.zipCode || "N/A"}</p></div>
                                      </div>
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Full Address</p><p className="font-medium leading-relaxed">{shop.street}, {shop.city}, {shop.state}, {shop.country}</p></div>
                                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Latitude</p><p className="font-mono text-[10px]">{shop.latitude?.toFixed(6) || "N/A"}</p></div>
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Longitude</p><p className="font-mono text-[10px]">{shop.longitude?.toFixed(6) || "N/A"}</p></div>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="h-3 w-3" /> Operations & Policy</h4>
                                    <div className="grid gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm">
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Operational Hours</p><p className="font-medium whitespace-pre-line leading-snug">{shop.operationalHours || "Mon - Sat: 09:00 - 21:00"}</p></div>
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Store Policy</p><p className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic">{shop.storePolicy || "Standard return and service policies apply as per platform defaults."}</p></div>
                                      <div className="pt-2 border-t flex justify-between items-center">
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Last System Update</p>
                                        <p className="text-[10px] font-bold">{formatDate(shop.updatedAt)}</p>
                                      </div>
                                    </div>
                                  </section>
                                </div>
                              </div>

                              <div className="flex gap-4 pt-6 border-t">
                                <Button variant="outline" onClick={() => handleUpdateStatus(shop.id, 'rejected')} className="flex-1 h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 font-bold uppercase tracking-widest text-xs"><XCircle className="h-4 w-4 mr-2" /> Reject Application</Button>
                                <Button onClick={() => handleUpdateStatus(shop.id, 'approved')} className="flex-[2] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20"><CheckCircle2 className="h-4 w-4 mr-2" /> Final Approval</Button>
                              </div>
                            </div>
                          </ScrollArea>
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
