"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, BarChart3, ClipboardCheck, Home, Receipt, ShoppingBag, Tags, Users, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/revenue", label: "Revenue", icon: WalletCards },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/daily-closing", label: "Daily Closing", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/users", label: "Users", icon: Users, permission: "users:read" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "roles:read" },
  { href: "/categories", label: "Categories", icon: Tags, permission: "categories:read" },
];

export function Sidebar() {
  const pathname = usePathname();
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const allowedItems = items.filter((item) => {
    if ("permission" in item) return permissions.includes(item.permission as string);
    return permissions.includes(`${item.href.replace("/", "")}:view`) || permissions.includes(`${item.href.replace("/", "")}:read`);
  });
  return (
    <aside className="hidden w-64 border-r bg-card md:block">
      <div className="flex h-16 items-center border-b px-5">
        <div>
          <p className="text-sm font-semibold">Store Finance</p>
          <p className="text-xs text-muted-foreground">Management Portal</p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", pathname === item.href && "bg-primary/10 text-primary")}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
