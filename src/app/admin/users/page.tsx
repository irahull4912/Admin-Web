"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { collection, query, where, getDocs, limit, Timestamp, orderBy, onSnapshot } from "firebase/firestore";
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
  Mail,
  ShieldCheck,
  Calendar,
  Zap
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

function UserManagementContent() {
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Fetch all users for the directory view
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "users"), orderBy("email", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setAllUsers(users);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user directory:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSearch = useCallback(async (customTerm?: string) => {
    const term = customTerm || searchTerm;
    if (!term || !user) {
      setFoundUser(null);
      return;
    }
    
    setLoading(true);
    setFoundUser(null);

    try {
      const usersRef = collection(db, "users");
      // Search by email
      let qUser = query(usersRef, where("email", "==", term), limit(1));
      let snapshot = await getDocs(qUser);

      // Search by ID if email yields nothing
      if (snapshot.empty) {
        qUser = query(usersRef, where("id", "==", term), limit(1));
        snapshot = await getDocs(qUser);
      }

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const userData = { id: doc.id, ...doc.data() } as UserProfile;
        setFoundUser(userData);
      }
    } catch (error) {
      console.error("Search error:", error);
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

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    try { return format(d, "MMM d, yyyy"); } catch { return "Invalid Date"; }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (['active', 'approved', 'successful'].includes(s)) 
      return <Badge className="bg-brand-green/10 text-brand-green border-brand-green/20 shadow-none uppercase font-bold text-[10px]">Active</Badge>;
    if (s === 'pending') 
      return <Badge className="bg-brand-orange/10 text-brand-orange border-brand-orange/20 shadow-none uppercase font-bold text-[10px]">Pending</Badge>;
    return <Badge variant="destructive" className="bg-brand-red/10 text-brand-red border-brand-red/20 shadow-none uppercase text-[10px] tracking-widest font-bold">{s || "Inactive"}</Badge>;
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Identity Center</h1>
          <p className="text-muted-foreground text-lg font-medium">Platform-wide profile management and deep audit logs.</p>
        </div>
        <div className="flex items-center gap-3">
          {(foundUser || searchTerm) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { 
                setFoundUser(null); 
                setSearchTerm(""); 
                router.push('/admin/users'); 
              }} 
              className="rounded-xl shadow-sm h-11 px-6 border-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Clear
            </Button>
          )}
          <div className="flex gap-2 min-w-[300px] md:min-w-[400px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Lookup by email or UID..." 
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-brand-red" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
              />
            </div>
            <Button onClick={() => handleSearch()} disabled={loading} size="lg" className="h-11 px-8 rounded-xl shadow-lg shadow-brand-red/20 bg-brand-red hover:bg-brand-red/90 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Inspect"}
            </Button>
          </div>
        </div>
      </div>

      {loading && !allUsers.length ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-red" />
        </div>
      ) : foundUser ? (
        <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-border/50 bg-white shadow-sm h-fit rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-brand-red shadow-lg shadow-brand-red/20 flex items-center justify-center">
                    <UserIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">User Dossier</CardTitle>
                    <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-slate-400">UID: {foundUser.id}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Display Identity</p>
                    <p className="text-lg font-bold text-slate-900">{foundUser.displayName || foundUser.name || "Anonymous User"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Authenticated Email</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-blue">
                      <Mail className="h-4 w-4" />
                      {foundUser.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                    {getStatusBadge(foundUser.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border/50 bg-white shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-brand-red" />
                  Detailed Attributes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <Phone className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verified Phone</p>
                        <p className="font-semibold text-slate-900">{foundUser.phoneNumber || "No phone recorded"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <MapPin className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operating Location</p>
                        <p className="font-semibold text-slate-900 leading-snug">{foundUser.location || "Location undefined"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                     <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registration Date</p>
                        <p className="font-semibold text-slate-900">{formatDate(foundUser.createdAt || foundUser.registrationDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <ShieldCheck className="h-5 w-5 text-brand-green" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User Role</p>
                        <p className="font-semibold text-slate-900">{foundUser.role || "Standard User"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-border/50 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b py-6 px-8">
            <div className="flex items-center gap-3">
              <div className="bg-brand-red/10 p-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-brand-red" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Global Identity Directory</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Centralized database of all registered platform users.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">User Identity</TableHead>
                  <TableHead className="py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Authenticated Email</TableHead>
                  <TableHead className="py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Location</TableHead>
                  <TableHead className="py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Registered</TableHead>
                  <TableHead className="text-right pr-8 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic font-medium">
                      No users found in the identity directory.
                    </TableCell>
                  </TableRow>
                ) : (
                  allUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/10 transition-colors group cursor-pointer" onClick={() => { setSearchTerm(u.email); handleSearch(u.email); }}>
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-brand-red transition-colors">{u.displayName || u.name || "Anonymous"}</span>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase">UID: {u.id.slice(0, 12)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-brand-blue opacity-50" />
                          <span className="font-medium text-sm text-slate-700">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-600">{u.location || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-500">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        {getStatusBadge(u.status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!foundUser && !loading && searchTerm && allUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6"><UserIcon className="h-10 w-10 text-slate-200" /></div>
          <h3 className="text-xl font-bold text-slate-900">Zero Matches Found</h3>
          <p className="text-slate-500 max-w-sm text-center mt-2 px-6">The credentials <span className="text-brand-red font-mono">{searchTerm}</span> do not correspond to any registered identities.</p>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-96 gap-6"><Loader2 className="h-12 w-12 animate-spin text-brand-red" /></div>}>
      <UserManagementContent />
    </Suspense>
  );
}
