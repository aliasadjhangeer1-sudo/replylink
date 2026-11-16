"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CreditCard,
  Instagram,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/automations", label: "Automations", icon: Bot },
  { href: "/accounts", label: "Accounts", icon: Instagram },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/logs", label: "Activity logs", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppShellProps {
  email: string;
  isAdmin: boolean;
  children: React.ReactNode;
}

export default function AppShell({ email, isAdmin, children }: AppShellProps) {
  const pathname = usePathname();

  async function logout() {
    const s = createSupabaseBrowserClient();
    await s.auth.signOut();
    location.href = "/";
  }

  const items = isAdmin
    ? [...NAV, { href: "/admin", label: "Admin panel", icon: ShieldCheck }]
    : NAV;

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="container flex items-center justify-between py-5">
          <Link href="/" className="text-xl font-black">
            ➤ Reply<span className="text-orange-400">Link</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="muted hidden sm:inline">{email}</span>
            <button onClick={logout} className="flex items-center gap-2 text-slate-300">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>
      <div className="container grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex gap-3 rounded-xl bg-violet-500/10 p-3 text-violet-200"
                    : "muted flex gap-3 p-3 hover:text-slate-200"
                }
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}
