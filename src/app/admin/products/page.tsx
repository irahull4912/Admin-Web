"use client";

import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, orderBy, Timestamp, updateDoc, collection } from "firebase/firestore";
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
  Info,
  Layers,
  Calendar,
  FileText,
  CheckCircle2,
  Clock
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

interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  status: string;
  createdAt: any;
  creationDate?: any;
}

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchProductsData = async () => {
    try {
      setLoading(true);
      
      const shopsSnap = await getDocs(collection(db, "shops"));
      const shopsMap: Record<string, string> = {};
      shopsSnap.forEach(doc => {
        shopsMap[doc.id] = doc.data().name || "Unknown Shop";
      });
      setShopNames(shopsMap);

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

  useEffect(() => {
    const results = products.filter(product => {
      const shopName = shopNames[product.sellerId] || "";
      return (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredProducts(results);
  }, [searchTerm, products, shopNames]);

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
    const dateValue = timestamp || null;
    if (!dateValue) return "N/A";
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
    try {
      return format(date, "MMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const totalProductsCount = products.length;
  const activeProductsCount = products.filter(p => (p.status || "").toLowerCase() === 'active').length;
  
  const averagePriceValue = products.length > 0 
    ? products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length 
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
              placeholder="Search products or shops..." 
              className="pl-9 h-11 rounded-xl shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shadow-sm">
            <Filter className="h-4 w-4" />
          </Button>
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
                <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{averagePriceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
              <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Comprehensive database of all items across all shops.</CardDescription>
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
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/10 transition-colors group">
                    <TableCell className="pl-8">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex flex-col items-start text-left hover:text-primary transition-colors group/name outline-none">
                            <span className="font-black text-slate-900 group-hover/name:underline decoration-primary/30 underline-offset-4">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">UID: {product.id.slice(0, 12)}</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                          <ScrollArea className="h-full max-h-[90vh]">
                            <div className="p-10 space-y-10 pb-16">
                              <DialogHeader>
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-slate-50 px-3 py-1 border-slate-200">UID: {product.id}</Badge>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-slate-50 px-3 py-1 border-slate-200">Shop Ref: {product.sellerId.slice(0, 8)}...</Badge>
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
                                <DialogDescription className="text-lg text-slate-500 font-medium italic">Detailed catalog dossier and merchant mapping.</DialogDescription>
                              </DialogHeader>

                              <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 group">
                                <Image 
                                  src={`https://picsum.photos/seed/${product.id}/800/450`} 
                                  alt={product.name} 
                                  fill 
                                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                                  data-ai-hint="product item"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                <div className="absolute bottom-6 left-6 flex items-center gap-2">
                                  <div className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-white/20">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Price Point</p>
                                    <p className="text-2xl font-black text-primary leading-none">₹{(product.price || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Layers className="h-3.5 w-3.5 text-primary" /> Classification</h4>
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-5 shadow-sm">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Category</p><p className="font-bold text-sm text-slate-900">{product.category}</p></div>
                                        <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Subcategory</p><p className="font-bold text-sm text-slate-900">{product.subcategory || "N/A"}</p></div>
                                      </div>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Store className="h-3.5 w-3.5 text-blue-500" /> Merchant Context</h4>
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                      <div><p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Associated Shop</p><p className="font-bold text-sm text-slate-900">{shopNames[product.sellerId] || "Unknown Shop"}</p></div>
                                      <div className="pt-3 mt-3 border-t border-slate-200/50">
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Seller Identity</p>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase">{product.sellerId}</p>
                                      </div>
                                    </div>
                                  </section>
                                </div>

                                <div className="space-y-8">
                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><FileText className="h-3.5 w-3.5 text-slate-400" /> Item Description</h4>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        {product.description || "No description provided for this catalog entry. Administrators should ensure the merchant provides accurate item details for buyer confidence."}
                                      </p>
                                    </div>
                                  </section>

                                  <section className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Audit Timeline</h4>
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                          <Clock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div>
                                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Catalog Entry Created</p>
                                          <p className="font-bold text-xs text-slate-700">{formatProductDate(product.createdAt || product.creationDate)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </section>
                                </div>
                              </div>

                              <div className="flex gap-4 pt-10 border-t border-slate-100">
                                <Button 
                                  className="flex-1 h-16 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95"
                                  asChild
                                >
                                  <Link href={`/admin/pings?search=${encodeURIComponent(product.name)}`}>
                                    <Activity className="h-5 w-5 mr-3" /> View Transaction Pings
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-tighter bg-slate-50 text-slate-500 border-slate-200 shadow-none">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-slate-900">
                      ₹{(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-semibold text-slate-700">
                          {shopNames[product.sellerId] || `ID: ${product.sellerId.slice(0, 8)}...`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500">
                      {formatProductDate(product.createdAt || product.creationDate)}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
