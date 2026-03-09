
"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
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
import { Store, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Seller {
  id: string;
  name: string;
  contactEmail: string;
  status: string;
  registrationDate: string;
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sellers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sellerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Seller[];
      setSellers(sellerData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sellers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSellerStatus = async (sellerId: string, newStatus: string) => {
    try {
      const sellerRef = doc(db, "sellers", sellerId);
      await updateDoc(sellerRef, { status: newStatus });
      toast({
        title: "Success",
        description: `Seller status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating seller status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update seller status",
      });
    }
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
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Sellers Management</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage shop approvals and status across the platform.</p>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle>Registered Shops</CardTitle>
          </div>
          <CardDescription>A complete list of all sellers on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No sellers found.
                  </TableCell>
                </TableRow>
              ) : (
                sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.contactEmail}</TableCell>
                    <TableCell>
                      <Badge variant={seller.status === "Active" ? "default" : "secondary"}>
                        {seller.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(seller.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {seller.status !== "Active" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 gap-1 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => updateSellerStatus(seller.id, "Active")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      )}
                      {seller.status !== "Suspended" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={() => updateSellerStatus(seller.id, "Suspended")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Suspend
                        </Button>
                      )}
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
