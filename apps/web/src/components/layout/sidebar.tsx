"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, BarChart3, ClipboardCheck, Home, Receipt, ShoppingBag, Tags, Users, WalletCards, Landmark, Store, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/revenue", label: "Revenue", icon: WalletCards },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/taxes", label: "Taxes", icon: Calculator, permission: "taxes:read" },
  { href: "/daily-closing", label: "Daily Closing", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/users", label: "Users", icon: Users, permission: "users:read" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "roles:read" },
  { href: "/categories", label: "Categories", icon: Tags, permission: "categories:read" },
  { href: "/stores", label: "Stores", icon: Store, permission: "stores:read" },
  { href: "/companies", label: "Companies", icon: Landmark, permission: "companies:read" },
];

export function Sidebar() {
  const pathname = usePathname();
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const allowedItems = items.filter((item) => {
    if ("permission" in item) return permissions.includes(item.permission as string);
    return permissions.includes(`${item.href.replace("/", "")}:view`) || permissions.includes(`${item.href.replace("/", "")}:read`);
  });
  return (
    <aside className="hidden w-64 border-r bg-gradient-to-b from-card to-background md:block">
      <div className="flex h-16 items-center border-b px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Store Finance</p>
            <p className="text-xs text-muted-foreground">Management Portal</p>
          </div>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", active ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25" : "text-muted-foreground hover:bg-primary/10 hover:text-primary")}>
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors", active ? "bg-white/20" : "bg-muted group-hover:bg-primary/10")}>
                <Icon className={cn("h-4 w-4", active && "text-white")} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
