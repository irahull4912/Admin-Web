"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
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
import { Search, User, ShoppingBag, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  registrationDate: string;
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
        const userData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile;
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1 text-lg">Search for users to view profiles and purchase history.</p>
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 border-border bg-card/40 backdrop-blur h-fit">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>User Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Name</p>
                <p className="text-lg font-bold">{foundUser.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                <p className="text-foreground">{foundUser.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                <Badge variant={foundUser.status === "Active" ? "default" : "secondary"}>
                  {foundUser.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered On</p>
                <p className="text-foreground">
                  {foundUser.registrationDate ? new Date(foundUser.registrationDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-border bg-card/40 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <CardTitle>Purchase History</CardTitle>
              </div>
              <CardDescription>A list of all transactions made by this user.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No purchases found for this user.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>${purchase.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
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
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Search for a user to see their details.</p>
          </div>
        )
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UserManagementContent />
    </Suspense>
  );
}