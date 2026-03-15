"use client";

import { useEffect, useState, useMemo } from "react";
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
  ArrowLeft,
  User,
  Mail,
  Search,
  Tag,
  ShieldCheck,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredShops = useMemo(() => {
    if (!searchTerm) return shops;
    const term = searchTerm.toLowerCase();
    return shops.filter(shop => 
      shop.name?.toLowerCase().includes(term) ||
      shop.ownerName?.toLowerCase().includes(term) ||
      shop.contactEmail?.toLowerCase().includes(term) ||
      shop.id?.toLowerCase().includes(term)
    );
  }, [shops, searchTerm]);

  const handleUpdateStatus = (shopId: string, newStatus: string) => {
    const docRef = doc(db, "shops", shopId);
    updateDocumentNonBlocking(docRef, { status: newStatus });
    setSelectedShop(null);
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 hover:bg-slate-200/50">
            <Link href="/admin/dashboard"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-foreground tracking-tight">Shop Approvals</h1>
            <p className="text-muted-foreground text-lg font-medium">Detailed merchant dossiers for platform quality inspection.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search pending applications..." 
              className="pl-9 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-brand-red"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur overflow-hidden shadow-xl rounded-3xl border-none">
        <CardHeader className="bg-muted/30 border-b p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Awaiting Verification</CardTitle>
                <CardDescription>Review new applications for operational compliance.</CardDescription>
              </div>
            </div>
            <Badge className="bg-primary px-4 py-1.5 rounded-full text-white font-bold tracking-wider">{filteredShops.length} MATCHING APPLICATIONS</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Merchant Identity</TableHead>
                <TableHead className="py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Principal Agent</TableHead>
                <TableHead className="py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Geographic Node</TableHead>
                <TableHead className="text-right pr-8 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Audit Workflow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-96 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground opacity-50">
                      <ShieldCheck className="h-20 w-20" />
                      <p className="font-bold text-xl tracking-tight">Queue is currently clear.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredShops.map((shop) => (
                  <TableRow key={shop.id} className="hover:bg-muted/10 transition-colors group">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-lg text-slate-900 leading-none mb-1">{shop.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">REF: {shop.id.slice(0, 16)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-700">{shop.ownerName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {shop.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <MapPin className="h-4 w-4 text-primary/60" />
                        {shop.city}, {shop.state}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedShop(shop)} className="h-10 px-5 rounded-xl border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-all font-bold">
                            <FileText className="h-4 w-4 mr-2" /> Inspect Dossier
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                          <ScrollArea className="h-full max-h-[90vh]">
                            <div className="p-10 space-y-10 pb-16">
                              <DialogHeader>
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 bg-slate-50">Merchant ID: {shop.id}</Badge>
                                    <Badge variant="outline" className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 bg-slate-50">Seller Ref: {shop.sellerId || "N/A"}</Badge>
                                  </div>
                                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase text-[10px] font-black px-4 py-1.5 shadow-none">VERIFICATION PENDING</Badge>
                                </div>
                                <DialogTitle className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight">{shop.name}</DialogTitle>
                                <DialogDescription className="text-lg text-slate-500 font-medium">Platform-wide merchant registration dossier and operational profile.</DialogDescription>
                              </DialogHeader>

                              <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-slate-100 group">
                                {shop.imageUrl ? (
                                  <Image src={shop.imageUrl} alt={shop.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
                                    <Store className="h-20 w-20 opacity-10" />
                                    <p className="text-xs uppercase font-black tracking-widest opacity-20">No Image Asset Provided</p>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Tag className="h-3.5 w-3.5 text-primary" /> Identity & Classification</h4>
                                    <div className="grid gap-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Category</p><p className="font-black text-sm text-slate-900">{shop.category || "General Retail"}</p></div>
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Status</p><p className="font-black text-sm text-amber-600 uppercase tracking-tighter">{shop.status}</p></div>
                                      </div>
                                      <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Registration Date</p><p className="font-bold text-xs text-slate-700">{formatDate(shop.createdAt)}</p></div>
                                        <div className="text-right"><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Last System Update</p><p className="font-bold text-xs text-slate-700">{formatDate(shop.updatedAt)}</p></div>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><User className="h-3.5 w-3.5 text-blue-500" /> Ownership Context</h4>
                                    <div className="grid gap-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Principal Official</p><p className="font-black text-base text-slate-900">{shop.ownerName}</p></div>
                                      <div className="pt-4 border-t border-slate-200/50 space-y-4">
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Contact Email</p><p className="font-black text-sm text-primary underline decoration-2 underline-offset-4">{shop.contactEmail}</p></div>
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Validated Phone</p><p className="font-black text-sm text-slate-900 flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {shop.contactNumber || "Not Provided"}</p></div>
                                      </div>
                                    </div>
                                  </section>
                                </div>

                                <div className="space-y-8">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><MapPin className="h-3.5 w-3.5 text-destructive" /> Geographic Dossier</h4>
                                    <div className="grid gap-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Door / Premise No.</p><p className="font-black text-sm text-slate-900">{shop.doorNo || "N/A"}</p></div>
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Zip / Postal Code</p><p className="font-black text-sm text-slate-900 font-mono tracking-tighter">{shop.zipCode || "N/A"}</p></div>
                                      </div>
                                      <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">Thoroughfare</p><p className="font-black text-sm text-slate-900 leading-tight">{shop.street}</p></div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">City / Township</p><p className="font-black text-sm text-slate-900">{shop.city}</p></div>
                                        <div><p className="text-[10px] text-muted-foreground uppercase font-black mb-1 tracking-widest">State / Province</p><p className="font-black text-sm text-slate-900">{shop.state}</p></div>
                                      </div>
                                    </div>
                                  </section>
                                </div>
                              </div>

                              <div className="flex gap-4 pt-10 border-t border-slate-100 mt-6">
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleUpdateStatus(shop.id, 'rejected')} 
                                  className="flex-1 h-16 rounded-3xl border-destructive/30 text-destructive hover:bg-destructive/5 font-black uppercase tracking-widest text-xs"
                                >
                                  <XCircle className="h-5 w-5 mr-3" /> Reject Application
                                </Button>
                                <Button 
                                  onClick={() => handleUpdateStatus(shop.id, 'approved')} 
                                  className="flex-[2] h-16 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <CheckCircle2 className="h-5 w-5 mr-3" /> Final Approval
                                </Button>
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
