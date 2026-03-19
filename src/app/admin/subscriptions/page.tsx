
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
import { CreditCard, Clock, AlertTriangle, Loader2, Search, ArrowLeft, Filter, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "../components/stat-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  subscriberId: string;
  subscriberType: "User" | "Seller";
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  isTrial: boolean | string;
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
      sub.planName.toLowerCase().includes(term) ||
      sub.subscriberType.toLowerCase().includes(term) ||
      sub.status.toLowerCase().includes(term) ||
      sub.id.toLowerCase().includes(term)
    );
  }, [subscriptions, searchTerm]);

  // "Real" Subscriptions = Active and NOT Trial
  const realActiveCount = useMemo(() => 
    subscriptions.filter(s => {
      const isActive = (s.status || "").toLowerCase() === "active";
      const isTrial = s.isTrial === true || String(s.isTrial) === "true";
      return isActive && !isTrial;
    }).length, 
  [subscriptions]);

  const trialsCount = useMemo(() => 
    subscriptions.filter(sub => sub.isTrial === true || String(sub.isTrial) === "true").length, 
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
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Subscription Tracking</h1>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Monitor active plans, trials, and upcoming renewals.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by plan, type or status..." 
              className="pl-9 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-brand-red"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          label="Real Subscriptions" 
          value={loading ? "..." : realActiveCount} 
          icon={CreditCard}
          trend="Active Paid"
          trendType="positive"
        />
        <StatCard 
          label="Trial Periods" 
          value={loading ? "..." : trialsCount} 
          icon={Clock}
          trend={trialsCount > 0 ? "Potential Leads" : "No Active Trials"}
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
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Plan Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-5">Termination Date</TableHead>
                <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest py-5">Cycle Type</TableHead>
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
                    <TableCell className="font-black text-sm text-slate-900">{sub.planName}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-black uppercase text-[10px] tracking-widest px-3 py-1",
                        (sub.status || "").toLowerCase() === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-100 text-slate-600"
                      )}>
                        {sub.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-500">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {sub.isTrial === true || String(sub.isTrial) === "true" ? (
                        <Badge className="bg-brand-orange/10 text-brand-orange border-brand-orange/20 uppercase font-black text-[9px] tracking-widest px-3">TRIAL ACCESS</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200 uppercase font-black text-[9px] tracking-widest px-3">STANDARD CYCLE</Badge>
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
