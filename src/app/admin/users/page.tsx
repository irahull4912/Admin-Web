
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { collection, query, where, getDocs, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  User, 
  ShoppingBag, 
  Loader2, 
  Calendar, 
  MapPin, 
  Phone, 
  Shield, 
  Fingerprint,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string;
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

interface Purchase {
  id: string;
  productName?: string;
  totalPrice: number;
  purchaseDate: string;
  status: string;
}

function UserManagementContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSearch = useCallback(async (customTerm?: string) => {
    const term = customTerm || searchTerm;
    if (!term) return;
    
    setLoading(true);
    setFoundUser(null);
    setPurchases([]);

    try {
      const usersRef = collection(db, "users");
      // Search by email
      let q = query(usersRef, where("email", "==", term), limit(1));
      let snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Try searching by ID if email doesn't work
        q = query(usersRef, where("id", "==", term), limit(1));
        snapshot = await getDocs(q);
      }

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const userData = { id: doc.id, ...doc.data() } as UserProfile;
        setFoundUser(userData);

        // Fetch purchases for this user
        const purchasesRef = collection(db, "users", userData.id, "purchases");
        const purchasesSnapshot = await getDocs(purchasesRef);
        const purchaseData = purchasesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Purchase[];
        setPurchases(purchaseData);
      }
    } catch (error) {
      console.error("Error searching user:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Handle search parameter from URL
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchTerm(urlSearch);
      handleSearch(urlSearch);
    }
  }, [searchParams, handleSearch]);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    try {
      return format(d, "MMM d, yyyy HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">User Administration</h1>
          <p className="text-muted-foreground mt-1 text-lg">Detailed profile inspection and transaction auditing.</p>
        </div>
        {foundUser && (
          <Button variant="outline" size="sm" onClick={() => { setFoundUser(null); setSearchTerm(""); router.push('/admin/users'); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Clear View
          </Button>
        )}
      </div>

      <div className="flex gap-4 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email or user ID..." 
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={() => handleSearch()} disabled={loading} size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Search"}
        </Button>
      </div>

      {foundUser ? (
        <div className="flex flex-col gap-8 max-w-4xl">
          {/* Identity Dossier Card */}
          <Card className="border-border bg-card/40 backdrop-blur">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Identity Dossier</CardTitle>
                  <CardDescription>Verified system records for account {foundUser.id.slice(0, 8)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Full Name
                    </p>
                    <p className="text-lg font-bold text-foreground">{foundUser.displayName || foundUser.name}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Email Address
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {foundUser.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Fingerprint className="h-3 w-3" /> UID Reference
                    </p>
                    <code className="text-[11px] font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                      {foundUser.id}
                    </code>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="h-3 w-3" /> System Role
                    </p>
                    <Badge variant="outline" className="font-semibold text-primary border-primary/20 bg-primary/5">
                      {foundUser.role || "User"}
                    </Badge>
                  </div>
                </div>

                {/* Contact & Status */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> Phone
                      </p>
                      <p className="text-sm font-medium">{foundUser.phoneNumber || "None set"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Location
                      </p>
                      <p className="text-sm font-medium truncate" title={foundUser.location}>
                        {foundUser.location || "None set"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Registered Date
                    </p>
                    <p className="text-sm font-medium">{formatDate(foundUser.createdAt || foundUser.registrationDate)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Last Updated
                    </p>
                    <p className="text-sm font-medium">{formatDate(foundUser.updatedAt)}</p>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Account Status</p>
                    <Badge className={foundUser.status === "Active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"}>
                      {foundUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Audit History Card */}
          <Card className="border-border bg-card/40 backdrop-blur">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Purchase Audit History</CardTitle>
              </div>
              <CardDescription>Comprehensive list of resolved transactions associated with this account.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Transaction Date</TableHead>
                    <TableHead>Order Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingBag className="h-10 w-10 opacity-20" />
                          <p>No purchase records found for this identity.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">
                          {formatDate(purchase.purchaseDate)}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          ${purchase.totalPrice?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={purchase.status === "Completed" ? "default" : "secondary"}>
                            {purchase.status}
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
      ) : (
        !loading && searchTerm && (
          <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed border-border/60">
            <User className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Account Found</h3>
            <p className="text-sm text-muted-foreground/80 mt-1">Verify the email address or UID and try again.</p>
          </div>
        )
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Retrieving user profile data...</p>
      </div>
    }>
      <UserManagementContent />
    </Suspense>
  );
}
