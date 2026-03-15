"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { collection, query, where, getDocs, limit, Timestamp, orderBy, collectionGroup } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  User as UserIcon, 
  Loader2, 
  MapPin, 
  Phone, 
  Fingerprint,
  ArrowLeft,
  Mail
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  name?: string;
  displayName?: string;
  email: string;
  status: string;
  createdAt?: any;
  registrationDate?: any; 
  updatedAt?: any;
  location?: string;
  phoneNumber?: string;
  role?: string;
}

interface UserPing {
  id: string;
  createdAt: any;
  status: string;
  amount: number;
  shopId?: string;
  sellerId?: string;
  productId?: string;
  items?: { productId: string }[];
}

interface ResolvedMapping {
  shops: Record<string, string>;
  products: Record<string, { name: string; price: number }>;
}

function UserManagementContent() {
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [userPings, setUserPings] = useState<UserPing[]>([]);
  const [resolvedData, setResolvedData] = useState<ResolvedMapping>({ shops: {}, products: {} });
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSearch = useCallback(async (customTerm?: string) => {
    const term = customTerm || searchTerm;
    if (!term || !user) return;
    
    setLoading(true);
    setFoundUser(null);
    setUserPings([]);

    try {
      const usersRef = collection(db, "users");
      let qUser = query(usersRef, where("email", "==", term), limit(1));
      let snapshot = await getDocs(qUser);

      if (snapshot.empty) {
        qUser = query(usersRef, where("id", "==", term), limit(1));
        snapshot = await getDocs(qUser);
      }

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const userData = { id: doc.id, ...doc.data() } as UserProfile;
        setFoundUser(userData);

        const pingsRef = collection(db, "pings");
        const pingsQuery = query(pingsRef, where("buyerId", "==", userData.id), orderBy("createdAt", "desc"));
        const pingsSnapshot = await getDocs(pingsQuery);
        const pingData = pingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserPing[];
        setUserPings(pingData);

        const shopIds = new Set(pingData.map(p => p.shopId || p.sellerId).filter(Boolean) as string[]);
        const productIds = new Set(pingData.map(p => p.items?.[0]?.productId || p.productId).filter(Boolean) as string[]);

        const shopNames: Record<string, string> = {};
        const productDetails: Record<string, { name: string; price: number }> = {};

        if (shopIds.size > 0) {
          const shopsSnap = await getDocs(collection(db, "shops"));
          shopsSnap.forEach(sDoc => { if (shopIds.has(sDoc.id)) shopNames[sDoc.id] = sDoc.data().name || "Unknown Shop"; });
        }

        if (productIds.size > 0) {
          const productsSnap = await getDocs(collectionGroup(db, "products"));
          productsSnap.forEach(pDoc => { if (productIds.has(pDoc.id)) productDetails[pDoc.id] = { name: pDoc.data().name || "Unknown Product", price: pDoc.data().price || 0 }; });
        }

        setResolvedData({ shops: shopNames, products: productDetails });
      }
    } catch (error) {
      // Catch and log if needed
    } finally {
      setLoading(false);
    }
  }, [searchTerm, user]);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch && user) {
      setSearchTerm(urlSearch);
      handleSearch(urlSearch);
    }
  }, [searchParams, handleSearch, user]);

  if (isUserLoading || !user) return null;

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    try { return format(d, "MMM d, yyyy HH:mm"); } catch { return "Invalid Date"; }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (['successful', 'completed', 'success', 'active', 'approved'].includes(s)) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none">Active</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none">Pending</Badge>;
    return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 shadow-none uppercase text-[10px] tracking-widest">{s}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Identity Center</h1>
          <p className="text-muted-foreground text-lg font-medium">Platform-wide profile management and deep audit logs.</p>
        </div>
        <div className="flex items-center gap-3">
          {foundUser && (
            <Button variant="outline" size="sm" onClick={() => { setFoundUser(null); setSearchTerm(""); router.push('/admin/users'); }} className="rounded-xl shadow-sm h-11 px-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Reset Search
            </Button>
          )}
          <div className="flex gap-2 min-w-[300px] md:min-w-[400px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Lookup by email or UID..." className="pl-10 h-11 bg-white border-slate-200 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <Button onClick={() => handleSearch()} disabled={loading} size="lg" className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Inspect"}
            </Button>
          </div>
        </div>
      </div>

      {foundUser ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-border/50 bg-white shadow-sm h-fit">
              <CardHeader className="border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center">
                    <UserIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">User Dossier</CardTitle>
                    <CardDescription className="font-mono text-[10px] uppercase tracking-widest">{foundUser.id.slice(0, 16)}...</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Display Identity</p><p className="text-lg font-bold text-slate-900">{foundUser.displayName || "Anonymous User"}</p></div>
                  <div className="space-y-2"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Authenticated Email</p><div className="flex items-center gap-2 text-sm font-medium text-primary"><Mail className="h-4 w-4" />{foundUser.email}</div></div>
                  <div className="space-y-2"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>{getStatusBadge(foundUser.status)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border/50 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-50"><CardTitle className="text-lg flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" />Detailed Attributes</CardTitle></CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="flex items-start gap-4"><div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><Phone className="h-5 w-5 text-slate-400" /></div><div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verified Phone</p><p className="font-semibold text-slate-900">{foundUser.phoneNumber || "No phone recorded"}</p></div></div>
                    <div className="flex items-start gap-4"><div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><MapPin className="h-5 w-5 text-slate-400" /></div><div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operating Location</p><p className="font-semibold text-slate-900 leading-snug">{foundUser.location || "Location undefined"}</p></div></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : !loading && searchTerm && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6"><UserIcon className="h-10 w-10 text-slate-200" /></div>
          <h3 className="text-xl font-bold text-slate-900">Zero Matches Found</h3>
          <p className="text-slate-500 max-w-sm text-center mt-2 px-6">The credentials <span className="text-primary font-mono">{searchTerm}</span> do not correspond to any registered identities.</p>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-96 gap-6"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <UserManagementContent />
    </Suspense>
  );
}
