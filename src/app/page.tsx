import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogIn } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-accent rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
        <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit border border-primary/20 shadow-sm animate-in fade-in zoom-in duration-500">
          <ShieldCheck className="h-16 w-16 text-primary" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl animate-in slide-in-from-bottom-4 duration-700">
            Welcome to <span className="text-primary">AdminVault</span>
          </h1>
          <p className="text-xl text-muted-foreground animate-in slide-in-from-bottom-6 duration-1000">
            The secure management platform for your business operations. 
            Access your dashboard to manage users, products, and subscriptions with enterprise-grade security.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Button asChild size="lg" className="h-12 px-8 text-lg font-semibold gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
            <Link href="/admin/login">
              <LogIn className="w-5 h-5" />
              Admin Login
            </Link>
          </Button>
        </div>

        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-80 animate-in fade-in duration-1000 delay-500">
          {[
            { label: "Secure Access", desc: "Enterprise Verified" },
            { label: "Real-time Stats", desc: "Live monitoring" },
            { label: "Easy Control", desc: "One-click actions" }
          ].map((feature, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
              <p className="font-bold text-foreground">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
