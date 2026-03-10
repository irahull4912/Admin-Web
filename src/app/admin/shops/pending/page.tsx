
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  User
} from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Image from "next/image";
import Link from "next/link";

interface PendingShop {
  id: string;
  name: string;
  ownerName: string;
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
    // Fetch all documents from shops collection where status == 'pending'
    const q = query(collection(db, "shops"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shopData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingShop[];
      setShops(shopData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pending shops:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = (shopId: string, newStatus: string) => {
    const docRef = doc(db, "shops", shopId);
    updateDoc(docRef, { status: newStatus })
      .catch(async (e) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { status: newStatus }
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    setSelectedShop(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Pending Shops</h1>
          <p className="text-muted-foreground mt-1 text-lg">Review merchant registrations for platform approval.</p>
        </div>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Registration List</CardTitle>
            </div>
            <Badge variant="outline" className="font-mono">
              {shops.length} Pending
            </Badge>
          </div>
          <CardDescription>Click a shop name to review full details and decide on approval.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Store className="h-10 w-10 opacity-20" />
                      <p>No pending shop applications at this time.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                shops.map((shop) => (
                  <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-semibold">{shop.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {shop.ownerName}
                      </div>
                    </TableCell>
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
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{shop.name}</DialogTitle>
                            <DialogDescription>Full merchant dossier for registration {shop.id.slice(0, 8)}</DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6 py-4">
                            {/* Shop Image - Requirement: imageUrl */}
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border bg-muted/50">
                              {shop.imageUrl ? (
                                <Image 
                                  src={shop.imageUrl} 
                                  alt={shop.name} 
                                  fill 
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground italic">
                                  No imageUrl provided
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              {/* Contact - Requirement: contactNumber */}
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Owner</p>
                                  <p className="font-medium text-lg">{shop.ownerName}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Number</p>
                                  <div className="flex items-center gap-2 font-medium">
                                    <Phone className="h-4 w-4 text-primary" />
                                    {shop.contactNumber || "N/A"}
                                  </div>
                                </div>
                              </div>

                              {/* Location - Requirement: lat, lng, city, street */}
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</p>
                                  <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                      <span className="font-medium">
                                        {shop.location?.street}, {shop.location?.city}
                                      </span>
                                    </div>
                                    <div className="pl-6 text-xs text-muted-foreground font-mono space-y-0.5">
                                      <div>Lat: {shop.location?.latitude ?? "N/A"}</div>
                                      <div>Lng: {shop.location?.longitude ?? "N/A"}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <DialogFooter className="gap-2 sm:gap-0">
                            {/* Requirement: Reject Button -> 'rejected' */}
                            <Button 
                              variant="outline" 
                              onClick={() => handleUpdateStatus(shop.id, 'rejected')}
                              className="flex-1 sm:flex-none text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            {/* Requirement: Approve Button -> 'approved' */}
                            <Button 
                              onClick={() => handleUpdateStatus(shop.id, 'approved')}
                              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve Shop
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
