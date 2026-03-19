
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
import { CreditCard, Clock, Loader2, Search, ArrowLeft, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatCard } from "../components/stat-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  subscriberId: string;
  subscriberType: "User" | "Seller";
  subscriptionTier: string; // Renamed from planName
  startDate: string;
  endDate: string;
  subscriptionStatus: string; // Renamed from status
  paymentStatus: string | boolean; // Renamed from isTrial
  nextBillingDate?: string;
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
    if (!searchTerm) return subscriptions;
    const term = searchTerm.toLowerCase();
    return subscriptions.filter(sub => 
      (sub.subscriptionTier || "").toLowerCase().includes(term) ||
      (sub.subscriberType || "").toLowerCase().includes(term) ||
      (sub.subscriptionStatus || "").toLowerCase().includes(term) ||
      (sub.id || "").toLowerCase().includes(term)
    );
  }, [subscriptions, searchTerm]);

  // Logic updated per request
  const activeCount = useMemo(() => 
    subscriptions.filter(s => (s.subscriptionStatus || "").toLowerCase() === "active").length, 
  [subscriptions]);

  const trialsCount = useMemo(() => 
    subscriptions.filter(s => (String(s.paymentStatus)).toLowerCase() === "trial").length, 
  [subscriptions]);

  const totalCount = subscriptions.length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-red" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Subscription Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-brand-red transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Subscription Tracking</h1>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Monitor active plans, payment statuses, and node distributions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by tier, type or status..." 
              className="pl-9 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-brand-red"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          label="Active Subscriptions" 
          value={loading ? "..." : activeCount} 
          icon={CreditCard}
          trend="Total Active"
          trendType="positive"
        />
        <StatCard 
          label="Trial Periods" 
          value={loading ? "..." : trialsCount} 
          icon={Clock}
          trend={trialsCount > 0 ? "Pending Conversion" : "All Paid"}
          trendType={trialsCount > 0 ? "positive" : "negative"}
        />
        <StatCard 
          label="Total Nodes" 
          value={loading ? "..." : totalCount} 
          icon={Zap}
          trend="Platform-wide"
          trendType="positive"
        />
      </div>

      <Card className="border-border bg-card/40 backdrop-blur overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/50 border-b py-6 px-8">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-red" />
            <div>
              <CardTitle className="text-xl font-bold">Revenue Matrix</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed audit of all current platform subscription nodes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="pl-8 font-bold uppercase text-[10px] tracking-widest py-5">Node Type</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Tier Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Subscription Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Termination Date</TableHead>
                <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest py-5">Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic font-medium">
                    {searchTerm ? "No nodes matching your criteria." : "No active subscription data found in database."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-8">
                      <Badge variant="outline" className="font-black tracking-widest uppercase text-[10px] bg-slate-50">{sub.subscriberType}</Badge>
                    </TableCell>
                    <TableCell className="font-black text-sm text-slate-900">{sub.subscriptionTier}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-black uppercase text-[10px] tracking-widest px-3 py-1",
                        (sub.subscriptionStatus || "").toLowerCase() === "active" ? "bg-brand-green/10 text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600"
                      )}>
                        {sub.subscriptionStatus || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-500">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {(String(sub.paymentStatus)).toLowerCase() === "trial" ? (
                        <Badge className="bg-brand-orange/10 text-brand-orange border-brand-orange/20 uppercase font-black text-[9px] tracking-widest px-3">TRIAL ACCESS</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200 uppercase font-black text-[9px] tracking-widest px-3">PAID / STANDARD</Badge>
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
