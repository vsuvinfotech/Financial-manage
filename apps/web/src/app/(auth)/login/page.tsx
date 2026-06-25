"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, Mail, Lock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string; permissions: string[] };
};

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@store.local", password: "Admin@12345" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const session = await api<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(values) });
      setSession(session);
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
      <Card className="relative w-full max-w-md overflow-hidden border-0 shadow-2xl">
        <CardAccent />
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Sign in to Store Finance</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to access the dashboard.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                Email
              </Label>
              <Input {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                Password
              </Label>
              <Input type="password" {...form.register("password")} />
            </div>
            <Button variant="gradient" className="w-full" disabled={form.formState.isSubmitting}>
              <Sparkles className="h-4 w-4" />
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
