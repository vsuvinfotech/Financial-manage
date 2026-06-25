"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, Home, Receipt, ShoppingBag, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/revenue", label: "Revenue", icon: WalletCards },
  { href: "/expenses", label: "Expense", icon: Receipt },
  { href: "/purchases", label: "Buy", icon: ShoppingBag },
  { href: "/daily-closing", label: "Close", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const allowedItems = items.filter((item) => permissions.includes(`${item.href.replace("/", "")}:view`) || permissions.includes(`${item.href.replace("/", "")}:read`));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-card/90 pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      {allowedItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={cn("flex h-14 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}>
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-all", active ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md" : "bg-muted")}>
              <Icon className="h-4 w-4" />
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
