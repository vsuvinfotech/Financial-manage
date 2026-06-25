"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionExpiredStore } from "@/stores/session-expired-store";

const REDIRECT_SECONDS = 5;

export function SessionExpiredDialog() {
  const open = useSessionExpiredStore((s) => s.open);
  const hide = useSessionExpiredStore((s) => s.hide);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!open) {
      setCountdown(REDIRECT_SECONDS);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          goToLogin();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function goToLogin() {
    logout();
    hide();
    router.push("/login");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-[92%] max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-fuchsia-600 p-1" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Session expired</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Your session has timed out for security. Please log in again to continue.
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Redirecting to login in <span className="font-semibold text-rose-600">{countdown}s</span>...
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={goToLogin}
              className="bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white hover:from-rose-600 hover:to-fuchsia-700"
            >
              Go to Login Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
