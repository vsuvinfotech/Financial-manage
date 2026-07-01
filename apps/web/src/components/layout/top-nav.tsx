"use client";

import { Moon, Sun, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { StoreSwitcher } from "./store-switcher";

export function TopNav() {
  const { setTheme, theme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/60 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        <StoreSwitcher />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.name ?? "Store User"}</p>
            <p className="text-xs text-muted-foreground">
              {user?.role ?? "ADMIN"}
              {user?.companySlug && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  {user.companySlug}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => { logout(); router.push("/login"); }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
