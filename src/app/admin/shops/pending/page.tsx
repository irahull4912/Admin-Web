
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
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
  Mail
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PendingShop {
  id: string;
  name: string;
  ownerName: string;
  contactEmail: string;
  contactNumber?: string;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    street: string;
  };
  status: string;
}

export default function PendingShopsPage() {
  const [shops, setShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<PendingShop | null>(null);

  useEffect(() => {
    // Real-time listener for pending shops
    const q = query(collection(db, "shops"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shopData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingShop[];
      setShops(shopData);
      setLoading(false);
    }, (error) => {
      // Centralized error listener handles this
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = (shopId: string, newStatus: string) => {
    const docRef = doc(db, "shops", shopId);
    updateDocumentNonBlocking(docRef, { status: newStatus });
    setSelectedShop(null);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Retrieving pending applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Shop Approvals</h1>
          <p className="text-muted-foreground mt-1 text-lg">Review and manage new merchant registration applications.</p>
        </div>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Applications List</CardTitle>
            </div>
            <Badge variant="secondary" className="font-mono bg-primary/10 text-primary border-primary/20">
              {shops.length} Pending Approval
            </Badge>
          </div>
          <CardDescription>Click details to review the merchant dossier and make an approval decision.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Owner & Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="bg-muted/50 p-6 rounded-full">
                        <Store className="h-12 w-12 opacity-20" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">All caught up!</p>
                        <p className="text-sm">There are no pending shop registrations to review.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                shops.map((shop) => (
                  <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-bold text-base">{shop.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {shop.ownerName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {shop.contactEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-primary/60" />
                        <span className="truncate max-w-[200px]">{shop.location?.city || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedShop(shop)}
                            className="hover:bg-primary/5 border-primary/20 text-primary"
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Review Dossier
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{shop.name}</DialogTitle>
                            <DialogDescription>Full merchant registration details for account ID: {shop.id}</DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6 py-4">
                            {/* Shop Image */}
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border bg-muted/50 shadow-inner">
                              {shop.imageUrl ? (
                                <Image 
                                  src={shop.imageUrl} 
                                  alt={shop.name} 
                                  fill 
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                  <Store className="h-10 w-10 opacity-10" />
                                  <span className="text-xs italic">No image provided</span>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Merchant Principal</p>
                                  <p className="font-bold text-lg">{shop.ownerName}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Direct Contact</p>
                                  <div className="flex items-center gap-2 font-medium text-sm">
                                    <Phone className="h-4 w-4 text-primary" />
                                    {shop.contactNumber || "N/A"}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Geographic Location</p>
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                      <span className="font-medium text-sm leading-tight">
                                        {shop.location?.street},<br />{shop.location?.city}
                                      </span>
                                    </div>
                                    <div className="pl-6 text-[10px] text-muted-foreground font-mono space-y-0.5 border-l border-primary/20 ml-2">
                                      <div>Lat: {shop.location?.latitude?.toFixed(4) ?? "N/A"}</div>
                                      <div>Lng: {shop.location?.longitude?.toFixed(4) ?? "N/A"}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <DialogFooter className="gap-3 sm:gap-0 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => handleUpdateStatus(shop.id, 'rejected')}
                              className="flex-1 sm:flex-none text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Registration
                            </Button>
                            <Button 
                              onClick={() => handleUpdateStatus(shop.id, 'approved')}
                              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve Merchant
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
  );
}
