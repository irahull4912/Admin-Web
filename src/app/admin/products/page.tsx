"use client";

import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, orderBy, Timestamp, updateDoc, collection, where, onSnapshot } from "firebase/firestore";
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
  Package, 
  Search, 
  Filter, 
  Loader2, 
  ArrowLeft, 
  Tag, 
  IndianRupee, 
  Activity, 
  Store, 
  RefreshCw,
  Layers,
  Calendar,
  FileText,
  Clock,
  User,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  TicketPercent,
  Box,
  TrendingDown,
  Info,
  Zap,
  ShoppingCart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductVariant {
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
}

interface Product {
  id: string;
  sellerId: string;
  shopId?: string;
  name: string;
  brand?: string;
  description: string;
  price?: number; 
  sellingPrice?: number;
  mrp?: number;
  category: string;
  subCategory?: string;
  subcategory?: string; 
  status: string;
  stockStatus?: string;
  quantity?: number;
  imageUrls?: string[];
  offers?: string[];
  variants?: ProductVariant[];
  createdAt: any;
  updatedAt?: any;
}

interface ShopProfile {
  id: string;
  name: string;
  ownerName: string;
  contactEmail: string;
  city?: string;
  state?: string;
  street?: string;
}

interface PingRecord {
  id: string;
  createdAt: any;
  buyerId: string;
  status: string;
  amount: number;
}

/**
 * Embedded component to handle product-specific transaction auditing.
 */
function ProductAuditTrail({ productId }: { productId: string }) {
  const [pings, setPings] = useState<PingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerEmails, setBuyerEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!productId) return;

    // Simplified query to avoid composite index requirements
    const q = query(
      collection(db, "pings"), 
      where("productId", "==", productId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const pingData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PingRecord[];
      
      // Perform client-side sorting by creation date descending
      const sortedPings = pingData.sort((a, b) => {
        const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      setPings(sortedPings);
      setLoading(false);

      // Resolve buyer emails for these pings
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
    });

    return () => unsubscribe();
  }, [productId]);

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (['successful', 'completed', 'success'].includes(s)) return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] uppercase font-bold">Success</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] uppercase font-bold">Pending</Badge>;
    if (s === 'cancelled') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] uppercase font-bold">Cancelled</Badge>;
    return <Badge variant="outline" className="text-[9px] uppercase font-bold">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Compiling Transaction Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
        <Zap className="h-3.5 w-3.5 text-primary" /> Product Transaction Ledger
      </h4>
      
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-[9px] uppercase font-bold pl-6">Date</TableHead>
              <TableHead className="text-[9px] uppercase font-bold">Buyer Email</TableHead>
              <TableHead className="text-[9px] uppercase font-bold">Yield</TableHead>
              <TableHead className="text-[9px] uppercase font-bold text-right pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground italic">
                  No transaction pings detected for this product ID.
                </TableCell>
              </TableRow>
            ) : (
              pings.map((ping) => (
                <TableRow key={ping.id} className="hover:bg-slate-50/50 border-slate-50">
                  <TableCell className="py-3 pl-6 text-[10px] font-mono font-medium text-slate-500">
                    {ping.createdAt instanceof Timestamp ? format(ping.createdAt.toDate(), "MMM d, HH:mm") : "N/A"}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-700">
                    {buyerEmails[ping.buyerId] || "Resolving..."}
                  </TableCell>
                  <TableCell className="font-black text-primary text-xs">
                    ₹{(ping.amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right py-3 pr-6">
                    {getStatusBadge(ping.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [shopsData, setShopsData] = useState<Record<string, ShopProfile>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchProductsData = async () => {
    try {
      setLoading(true);
      
      const shopsSnap = await getDocs(collection(db, "shops"));
      const shopsMap: Record<string, ShopProfile> = {};
      shopsSnap.forEach(doc => {
        const data = doc.data();
        shopsMap[doc.id] = {
          id: doc.id,
          name: data.name || "Unknown Shop",
          ownerName: data.ownerName || "Unknown Owner",
          contactEmail: data.contactEmail || "N/A",
          city: data.city,
          state: data.state,
          street: data.street,
        };
      });
      setShopsData(shopsMap);

      const q = query(collectionGroup(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const productData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productData);
      setFilteredProducts(productData);
    } catch (error) {
      console.error("Error fetching products data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  const getShopForProduct = (product: Product) => {
    const idsToTry = [
      product.shopId, 
      product.sellerId, 
      `shop-${product.sellerId}`,
      product.sellerId?.startsWith('shop-') ? product.sellerId.replace('shop-', '') : null
    ].filter(Boolean) as string[];

    for (const id of idsToTry) {
      if (shopsData[id]) return shopsData[id];
    }
    return null;
  };

  useEffect(() => {
    const results = products.filter(product => {
      const shop = getShopForProduct(product);
      const shopName = shop?.name || "";
      return (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredProducts(results);
  }, [searchTerm, products, shopsData]);

  const handleBulkUpdateStatus = async () => {
    setUpdating(true);
    try {
      const q = query(collectionGroup(db, "products"));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map((docSnap) => 
        updateDoc(docSnap.ref, { status: 'active' })
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Database Synchronized",
        description: "All products updated to active status!",
      });
      
      await fetchProductsData();
    } catch (error) {
      console.error("Error updating products:", error);
      toast({
        variant: "destructive",
        title: "Synchronization Failed",
        description: "An error occurred during bulk status update.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatProductDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    try {
      return format(date, "MMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const totalProductsCount = products.length;
  const activeProductsCount = products.filter(p => (p.status || "").toLowerCase() === 'active').length;
  
  const averagePriceValue = products.length > 0 
    ? products.reduce((acc, p) => acc + (p.sellingPrice || p.price || 0), 0) / products.length 
    : 0;
  const uniqueSellersCount = new Set(products.map(p => p.sellerId)).size;

  if (loading && !updating) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Scanning Global Inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Products Inventory</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-lg">Detailed overview of all products listed on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            className="h-11 px-6 rounded-xl shadow-sm font-bold gap-2 bg-primary/5 text-primary hover:bg-primary/10 transition-all"
            onClick={handleBulkUpdateStatus}
            disabled={updating}
          >
            {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Active Status
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products or brands..." 
              className="pl-9 h-11 rounded-xl shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Products</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalProductsCount.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Items</p>
                <p className="text-3xl font-black text-emerald-600 tracking-tighter">{activeProductsCount.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Avg Price</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{averagePriceValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Unique Sellers</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{uniqueSellersCount.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <Store className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/50 border-b py-6 px-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Catalog Master List</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Comprehensive database of all items across all shops.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="pl-8 font-bold uppercase text-[10px] tracking-widest py-5">Product</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Category</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Price</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Shop</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Created</TableHead>
                <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest py-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground font-medium italic">
                    {updating ? "Synchronizing database records..." : "No products found matching your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const shop = getShopForProduct(product);
                  const currentPrice = product.sellingPrice || product.price || 0;
                  const mrp = product.mrp || 0;
                  const discount = mrp > currentPrice ? Math.round(((mrp - currentPrice) / mrp) * 100) : 0;

                  return (
                    <TableRow key={product.id} className="hover:bg-muted/10 transition-colors group">
                      <TableCell className="pl-8">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="flex flex-col items-start text-left hover:text-primary transition-colors group/name outline-none">
                              <span className="font-black text-slate-900 group-hover/name:underline decoration-primary/30 underline-offset-4">{product.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.brand && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase">{product.brand}</Badge>}
                                <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">UID: {product.id.slice(0, 12)}</span>
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[1000px] max-h-[95vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                            <ScrollArea className="h-full max-h-[95vh]">
                              <div className="p-8 space-y-10 pb-16">
                                <DialogHeader>
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-slate-50 px-3 py-1 border-slate-200">UID: {product.id}</Badge>
                                      {product.brand && <Badge className="bg-primary text-white text-[10px] font-black tracking-widest px-3 py-1 uppercase">{product.brand}</Badge>}
                                    </div>
                                    <Badge className={cn(
                                      "px-4 py-1.5 shadow-none uppercase text-[10px] font-black tracking-widest",
                                      (product.status || "").toLowerCase() === 'active' 
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    )}>
                                      {product.status || 'Draft'}
                                    </Badge>
                                  </div>
                                  <DialogTitle className="text-4xl font-headline font-black text-slate-900 leading-tight">{product.name}</DialogTitle>
                                  <DialogDescription className="text-lg text-slate-500 font-medium italic">Detailed technical dossier and multi-dimensional mapping.</DialogDescription>
                                </DialogHeader>

                                {/* Multi-Image Gallery */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  <div className="space-y-6">
                                    <div className="relative aspect-square w-full rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 group">
                                      {product.imageUrls && product.imageUrls.length > 0 ? (
                                        <Carousel className="w-full h-full">
                                          <CarouselContent className="h-full">
                                            {product.imageUrls.map((url, idx) => (
                                              <CarouselItem key={idx} className="relative aspect-square">
                                                <Image 
                                                  src={url} 
                                                  alt={`${product.name} ${idx + 1}`} 
                                                  fill 
                                                  className="object-cover"
                                                />
                                              </CarouselItem>
                                            ))}
                                          </CarouselContent>
                                          {product.imageUrls.length > 1 && (
                                            <>
                                              <CarouselPrevious className="left-4" />
                                              <CarouselNext className="right-4" />
                                            </>
                                          )}
                                        </Carousel>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                          <Package className="h-20 w-20 opacity-10" />
                                          <p className="text-xs uppercase font-bold tracking-widest opacity-20">No assets provided</p>
                                        </div>
                                      )}
                                      <div className="absolute top-4 left-4">
                                        <Badge className="bg-white/90 backdrop-blur text-primary text-[10px] font-black px-3 py-1 shadow-lg border-white/20">
                                          {product.stockStatus || "Active Stock"}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Pricing Analysis */}
                                    <section className="space-y-4">
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><IndianRupee className="h-3.5 w-3.5 text-primary" /> Pricing & Yield Analysis</h4>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                          <p className="text-[8px] text-muted-foreground uppercase font-bold mb-1">Selling Price</p>
                                          <p className="text-xl font-black text-primary">₹{(product.sellingPrice || product.price || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                          <p className="text-[8px] text-muted-foreground uppercase font-bold mb-1">MRP Value</p>
                                          <p className="text-xl font-black text-slate-400 line-through">₹{(product.mrp || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm text-center">
                                          <p className="text-[8px] text-emerald-600 uppercase font-bold mb-1">Discount %</p>
                                          <div className="flex items-center justify-center gap-1">
                                            <TrendingDown className="h-3 w-3 text-emerald-500" />
                                            <p className="text-xl font-black text-emerald-700">{discount}%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </section>
                                  </div>

                                  <div className="space-y-8">
                                    {/* Offers Section */}
                                    {product.offers && product.offers.length > 0 && (
                                      <section className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><TicketPercent className="h-3.5 w-3.5 text-amber-500" /> Promotional Campaigns</h4>
                                        <div className="bg-amber-100/30 p-4 rounded-2xl border border-amber-100 space-y-2">
                                          {product.offers.map((offer, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs font-semibold text-amber-800 bg-white/50 p-2 rounded-lg border border-amber-100">
                                              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                              {offer}
                                            </div>
                                          ))}
                                        </div>
                                      </section>
                                    )}

                                    <section className="space-y-4">
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Layers className="h-3.5 w-3.5 text-primary" /> Classification</h4>
                                      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-5 shadow-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Category</p><p className="font-bold text-sm text-slate-900">{product.category}</p></div>
                                          <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Subcategory</p><p className="font-bold text-sm text-slate-900">{product.subCategory || product.subcategory || "N/A"}</p></div>
                                          <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Total Quantity</p><p className="font-bold text-sm text-slate-900 flex items-center gap-2"><Box className="h-3.5 w-3.5 text-slate-400" /> {product.quantity || 0}</p></div>
                                          <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Stock Status</p><p className="font-bold text-sm text-emerald-600">{product.stockStatus || "In Stock"}</p></div>
                                        </div>
                                      </div>
                                    </section>

                                    <section className="space-y-4">
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Store className="h-3.5 w-3.5 text-blue-500" /> Merchant Mapping</h4>
                                      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                                        <div>
                                          <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Associated Shop</p>
                                          <p className="font-black text-lg text-slate-900 leading-tight">{shop?.name || "Unknown Shop"}</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 pt-3 border-t border-slate-200/50">
                                          <div className="flex items-center gap-3">
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            <div><p className="text-[8px] text-muted-foreground uppercase font-bold">Principal Agent</p><p className="font-bold text-xs">{shop?.ownerName || "N/A"}</p></div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <Mail className="h-3.5 w-3.5 text-primary" />
                                            <div><p className="text-[8px] text-muted-foreground uppercase font-bold">Contact Channel</p><p className="font-bold text-xs text-primary underline">{shop?.contactEmail || "N/A"}</p></div>
                                          </div>
                                        </div>
                                      </div>
                                    </section>
                                  </div>
                                </div>

                                {/* Variants Matrix */}
                                {product.variants && product.variants.length > 0 && (
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Activity className="h-3.5 w-3.5 text-emerald-500" /> SKU Variant Matrix</h4>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                      <Table>
                                        <TableHeader className="bg-slate-50">
                                          <TableRow>
                                            <TableHead className="text-[9px] uppercase font-bold">Color / Size</TableHead>
                                            <TableHead className="text-[9px] uppercase font-bold">Selling Price</TableHead>
                                            <TableHead className="text-[9px] uppercase font-bold">MRP</TableHead>
                                            <TableHead className="text-[9px] uppercase font-bold text-right">Available Stock</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {product.variants.map((variant, vIdx) => (
                                            <TableRow key={vIdx} className="hover:bg-slate-50/50 border-slate-50">
                                              <TableCell className="py-3">
                                                <div className="flex flex-col">
                                                  <span className="font-bold text-sm text-slate-900">{variant.color}</span>
                                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{variant.size}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="font-black text-primary text-sm">₹{variant.price.toLocaleString()}</TableCell>
                                              <TableCell className="text-muted-foreground text-xs line-through">₹{variant.mrp.toLocaleString()}</TableCell>
                                              <TableCell className="text-right py-3">
                                                <Badge variant="outline" className={cn(
                                                  "font-black text-[10px] px-2 py-0.5",
                                                  variant.stock > 5 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100"
                                                )}>
                                                  {variant.stock} UNITS
                                                </Badge>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </section>
                                )}

                                <section className="space-y-4">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><FileText className="h-3.5 w-3.5 text-slate-400" /> Performance Dossier</h4>
                                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[140px]">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                                      {product.description}
                                    </p>
                                  </div>
                                </section>

                                {/* Product-Specific Audit Trail */}
                                <ProductAuditTrail productId={product.id} />

                                <div className="flex gap-4 pt-8 border-t border-slate-100 items-center justify-between">
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Registered: {formatProductDate(product.createdAt)}</div>
                                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Last Update: {formatProductDate(product.updatedAt || product.createdAt)}</div>
                                  </div>
                                  <Button 
                                    className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-900/20 transition-all active:scale-95"
                                    onClick={() => {
                                      const element = document.getElementById('audit-ledger');
                                      element?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                  >
                                    <Activity className="h-4 w-4 mr-2.5" /> Inspect Full Audit
                                  </Button>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-tighter bg-slate-50 text-slate-500 border-slate-200 shadow-none">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-sm">₹{currentPrice.toLocaleString()}</span>
                          {discount > 0 && <span className="text-[10px] text-emerald-600 font-bold">-{discount}% OFF</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold text-slate-700">
                            {shop?.name || `ID: ${product.sellerId?.slice(0, 8)}...`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-500">
                        {formatProductDate(product.createdAt)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge className={cn(
                          "font-black uppercase text-[10px] px-3 py-1 shadow-none tracking-widest",
                          (product.status || "").toLowerCase() === 'active' 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {product.status || 'Draft'}
                        </Badge>
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
