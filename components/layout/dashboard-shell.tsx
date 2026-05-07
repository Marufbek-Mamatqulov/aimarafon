"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  BarChart3,
  ClipboardCheck,
  Home,
  LogOut,
  NotebookText,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const navItems = [
  { href: "/dashboard", label: "Bosh sahifa", icon: Home },
  { href: "/dashboard/tasks", label: "Topshiriqlar", icon: ClipboardCheck },
  { href: "/dashboard/submissions", label: "Yuborilganlar", icon: NotebookText },
  { href: "/dashboard/results", label: "Natijalar", icon: BarChart3 },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

interface DashboardShellProps {
  children: React.ReactNode;
  userLabel?: string | null;
  roleLabel?: string | null;
}

export function DashboardShell({ children, userLabel, roleLabel }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm lg:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Panel</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Shaxsiy kabinet</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white px-6 py-4 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
              <p className="text-lg font-semibold text-slate-900">Ishtirokchi paneli</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {userLabel && (
                <div>
                  <p className="font-medium text-slate-900">{userLabel}</p>
                  {roleLabel && <p className="text-xs text-slate-400">{roleLabel}</p>}
                </div>
              )}
              <Button variant="outline" className="gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Chiqish
              </Button>
            </div>
          </header>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
