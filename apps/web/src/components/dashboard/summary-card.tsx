import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currency, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type Accent =
  | "emerald"
  | "rose"
  | "amber"
  | "sky"
  | "violet"
  | "indigo"
  | "cyan";

const accents: Record<Accent, { gradient: string; ring: string; iconBg: string; iconText: string; glow: string }> = {
  emerald: {
    gradient: "from-emerald-500 via-emerald-600 to-teal-600",
    ring: "ring-emerald-300/40",
    iconBg: "bg-white/20",
    iconText: "text-white",
    glow: "shadow-emerald-500/30",
  },
  rose: {
    gradient: "from-rose-500 via-pink-600 to-fuchsia-600",
    ring: "ring-rose-300/40",
    iconBg: "bg-white/20",
    iconText: "text-white",
    glow: "shadow-rose-500/30",
  },
  amber: {
    gradient: "from-amber-500 via-orange-500 to-red-500",
    ring: "ring-amber-300/40",
    iconBg: "bg-white/20",
    iconText: "text-white",
    glow: "shadow-amber-500/30",
  },
  sky: {
    gradient: "from-sky-500 via-cyan-500 to-blue-600",
    ring: "ring-sky-300/40",
    iconBg: "bg-white/20",
    iconText: "text-white",
    glow: "shadow-sky-500/30",
  },
  violet: {
    gradient: "from-violet-500 via-purple-600 to-fuchsia-600",
    ring: "ring-violet-300/40",
    iconBg: "bg-white/20",
    iconText: "text-white",
    glow: "shadow-violet-500/30",
  },
  indigo: {
    gradient: "from-indigo-500 via-blue-600 to-cyan-500",
    ring: "ring-indigo-300/40",
    iconBg: "bg-white/20",
    iconText: "text-white",
    glow: "shadow-indigo-500/30",
  },
  cyan: {
    gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    ring: "ring-cyan-300/40",
    iconBg: "bg-white/20",
    iconText: "text-white",
    glow: "shadow-cyan-500/30",
  },
};

export function SummaryCard({
  title,
  value,
  icon: Icon,
  accent = "indigo",
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  accent?: Accent;
}) {
    const user = useAuthStore((state) => state.user);
    const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const a = accents[accent];
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl",
        "bg-gradient-to-br",
        a?.gradient ?? accents.indigo.gradient,
        a?.glow ?? accents.indigo.glow,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", a?.iconBg??a?.iconBg, a?.ring ?? a?.ring)}>
          <Icon className={cn("h-5 w-5", a?.iconText ?? a?.iconText)} />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold tracking-tight drop-shadow-sm">{!isPlatformAdmin?currency(value):value}</div>
      </CardContent>
    </Card>
  );
}
