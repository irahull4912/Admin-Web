"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
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
import { Zap, Search, Filter, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

interface PingRecord {
  id: string;
  createdAt: any;
  buyerId: string;
  sellerId: string;
  productId: string;
  status: string;
  amount: number;
}

export default function PingsManagementPage() {
  const [pings, setPings] = useState<PingRecord[]>([]);
  const [filteredPings, setFilteredPings] = useState<PingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Real-time listener for pings using createdAt as requested
    const q = query(collection(db, "pings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pingData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PingRecord[];
      setPings(pingData);
      setFilteredPings(pingData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const results = pings.filter(ping => 
      ping.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ping.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ping.buyerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ping.sellerId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPings(results);
  }, [searchTerm, pings]);

  const formatPingDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
    try {
      return format(date, "MMM d, yyyy h:mm a");
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase().trim();
    if (s === 'successful' || s === 'completed' || s === 'success') return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Successful</Badge>;
    if (s === 'pending') return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
    if (s === 'confirmed') return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Confirmed</Badge>;
    if (s === 'cancelled') return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
    if (s === 'expired') return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">Expired</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Ping Transactions</h1>
          </div>
          <p className="text-muted-foreground text-lg">Comprehensive audit log of all transaction pings on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search pings..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Total Pings</CardDescription>
            <CardTitle className="text-3xl">{pings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Success Rate</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">
              {pings.length > 0 
                ? `${((pings.filter(p => ['successful', 'completed', 'success'].includes(p.status.toLowerCase())).length / pings.length) * 100).toFixed(1)}%`
                : "0%"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Volume (7d)</CardDescription>
            <CardTitle className="text-3xl">
              {pings.filter(p => {
                const date = p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt);
                return date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/40 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Avg Amount</CardDescription>
            <CardTitle className="text-3xl">
              ${(pings.reduce((acc, p) => acc + (p.amount || 0), 0) / (pings.length || 1)).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Master Audit Log</CardTitle>
          </div>
          <CardDescription>Full history of every interaction between buyers and sellers.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Ping ID</TableHead>
                <TableHead>Buyer ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No pings found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPings.map((ping) => (
                  <TableRow key={ping.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {formatPingDate(ping.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-[10px]">{ping.id}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{ping.buyerId}</TableCell>
                    <TableCell className="font-semibold">${(ping.amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(ping.status)}
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
