
"use client";

import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
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
import { Package, Search, Filter, Loader2, ArrowLeft, Tag, DollarSign, Activity, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  status: string;
  creationDate: any;
}

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        // Using collectionGroup to aggregate products from all /shops/{shopId}/products collections
        const q = query(collectionGroup(db, "products"), orderBy("creationDate", "desc"));
        const snapshot = await getDocs(q);
        const productData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productData);
        setFilteredProducts(productData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    const results = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const formatProductDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    try {
      return format(date, "MMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status?.toLowerCase() === 'active').length;
  const averagePrice = products.length > 0 
    ? products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length 
    : 0;
  const uniqueSellers = new Set(products.map(p => p.sellerId)).size;

  if (loading) {
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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Products Inventory</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-lg">Detailed overview of all products listed on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
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
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalProducts.toLocaleString()}</p>
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
                <p className="text-3xl font-black text-emerald-600 tracking-tighter">{activeProducts.toLocaleString()}</p>
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
                <p className="text-3xl font-black text-slate-900 tracking-tighter">${averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Unique Sellers</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{uniqueSellers.toLocaleString()}</p>
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
                <TableHead className="pl-8 font-bold uppercase text-[10px] tracking-widest py-5">Product Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Category</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Price Point</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Seller ID</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Created</TableHead>
                <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest py-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground font-medium italic">
                    No products found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/10 transition-colors group">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">UID: {product.id.slice(0, 12)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-tighter bg-slate-50 text-slate-500 border-slate-200 shadow-none">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-slate-900">
                      ${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground uppercase">
                      {product.sellerId.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500">
                      {formatProductDate(product.creationDate)}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge className={cn(
                        "font-black uppercase text-[10px] px-3 py-1 shadow-none tracking-widest",
                        product.status?.toLowerCase() === 'active' 
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
