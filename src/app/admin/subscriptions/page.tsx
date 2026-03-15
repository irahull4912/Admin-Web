"use client";

import { useEffect, useState } from "react";
import { collectionGroup, query, where, onSnapshot } from "firebase/firestore";
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
import { CreditCard, Clock, AlertTriangle, Loader2 } from "lucide-react";

interface Subscription {
  id: string;
  subscriberId: string;
  subscriberType: "User" | "Seller";
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  isTrial: boolean;
  nextBillingDate?: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getEndingSoonCount = () => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return subscriptions.filter(sub => {
      const endDate = new Date(sub.endDate);
      return endDate > now && endDate <= nextWeek;
    }).length;
  };

  const trials = subscriptions.filter(sub => sub.isTrial);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Subscription Tracking</h1>
        <p className="text-muted-foreground text-lg font-medium">Monitor active plans, trials, and upcoming renewals.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card/40 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.filter(s => s.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">Across users and sellers</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trial Periods</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trials.length}</div>
            <p className="text-xs text-muted-foreground">Current active trials</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ending Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getEndingSoonCount()}</div>
            <p className="text-xs text-muted-foreground">Renewals in the next 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Master Subscriptions List</CardTitle>
          </div>
          <CardDescription>Unified view of all platform revenue streams.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest py-4">Type</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Plan</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">End Date</TableHead>
                <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest py-4">Trial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No subscriptions tracked yet.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="pl-6">
                      <Badge variant="outline" className="font-bold tracking-widest uppercase text-[10px]">{sub.subscriberType}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-sm">{sub.planName}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-bold uppercase text-[10px] tracking-widest",
                        sub.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-100 text-slate-600"
                      )}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right pr-6">
                      {sub.isTrial ? (
                        <Badge className="bg-accent/10 text-accent border-accent/20 uppercase font-black text-[9px] tracking-widest">Trial</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
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
