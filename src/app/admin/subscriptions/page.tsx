"use client";

import { useEffect, useState, useMemo } from "react";
import { collectionGroup, query, onSnapshot } from "firebase/firestore";
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
import { CreditCard, Clock, Loader2, Search, ArrowLeft, Zap, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatCard } from "../components/stat-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  subscriberId: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  paymentStatus: string;
  endDate?: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collectionGroup(db, "subscriptions"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscription[];
      setSubscriptions(subData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching subscriptions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return subscriptions.filter(sub => 
      (sub.subscriptionTier || "").toLowerCase().includes(term) ||
      (sub.subscriberId || "").toLowerCase().includes(term) ||
      (sub.paymentStatus || "").toLowerCase().includes(term)
    );
  }, [subscriptions, searchTerm]);

  const activeCount = useMemo(() => 
    subscriptions.filter(s => (s.subscriptionStatus || "").toLowerCase() === "active").length, 
  [subscriptions]);

  const trialsCount = useMemo(() => 
    subscriptions.filter(s => (s.paymentStatus || "").toLowerCase() === "trial").length, 
  [subscriptions]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading Plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Merchant Plans</h1>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Monitoring active subscriptions and trial nodes.</p>
        </div>
        <div className="relative w-64 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search plans or merchant IDs..." 
            className="pl-9 h-11 bg-white rounded-xl shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <StatCard 
          label="Active Shop Plans" 
          value={activeCount} 
          icon={CreditCard}
          trend="Total Revenue Nodes"
          trendType="positive"
        />
        <StatCard 
          label="Merchant Trials" 
          value={trialsCount} 
          icon={Clock}
          trend="Pending Conversions"
          trendType="positive"
        />
      </div>

      <Card className="border-border bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/50 border-b py-6 px-8">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold">Plan Audit Ledger</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="pl-8 font-bold uppercase text-[10px] tracking-widest py-5">Merchant ID</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Tier</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Expiry</TableHead>
                <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest py-5">Billing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic font-medium">
                    No matching records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-8">
                      <div className="flex items-center gap-2">
                        <Store className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs text-slate-500 uppercase">{sub.subscriberId?.slice(0, 12)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-sm text-slate-900">{sub.subscriptionTier}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-black uppercase text-[9px] tracking-widest px-2.5 py-0.5",
                        (sub.subscriptionStatus || "").toLowerCase() === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500"
                      )}>
                        {sub.subscriptionStatus || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {(sub.paymentStatus || "").toLowerCase() === "trial" ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 uppercase font-black text-[9px] tracking-widest px-2.5">TRIAL</Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 uppercase font-black text-[9px] tracking-widest px-2.5">PAID</Badge>
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
