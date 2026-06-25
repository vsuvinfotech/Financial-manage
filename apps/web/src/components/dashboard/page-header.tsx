"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Gradient = "indigo" | "emerald" | "rose" | "amber" | "sky" | "violet";

const gradients: Record<Gradient, string> = {
  indigo: "from-indigo-600 via-purple-600 to-pink-500",
  emerald: "from-emerald-500 via-teal-500 to-cyan-500",
  rose: "from-rose-500 via-pink-600 to-fuchsia-500",
  amber: "from-amber-500 via-orange-500 to-rose-500",
  sky: "from-sky-500 via-blue-500 to-indigo-500",
  violet: "from-violet-500 via-purple-600 to-fuchsia-600",
};

export function PageHeader({
  title,
  description,
  gradient = "indigo",
  children,
  className,
}: {
  title: string;
  description?: string;
  gradient?: Gradient;
  children?: React.ReactNode;
  className?: string;
}) {
  const g = gradients[gradient];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-r p-6 text-white shadow-xl",
        g,
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight drop-shadow-sm">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-white/85">{description}</p>
          )}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
