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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-card md:hidden">
      {allowedItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn("flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground", pathname === item.href && "text-primary")}>
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
