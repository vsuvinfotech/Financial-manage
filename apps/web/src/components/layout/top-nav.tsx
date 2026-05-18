"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export function TopNav() {
  const { setTheme, theme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div>
        <p className="text-sm font-medium">{user?.name ?? "Store User"}</p>
        <p className="text-xs text-muted-foreground">{user?.role ?? "ADMIN"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { logout(); router.push("/login"); }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
