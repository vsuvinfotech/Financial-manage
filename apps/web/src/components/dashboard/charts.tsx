"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const splitColors = ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#06b6d4", "#f43f5e"];

const tooltipStyle = {
  background: "rgba(17, 24, 39, 0.92)",
  border: "none",
  borderRadius: 12,
  color: "white",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)",
};

export function RevenueExpenseChart({ data }: { data: Array<{ date: string; revenue: number; expenses: number }> }) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg dark:from-slate-900 dark:to-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700/50">
        <CardTitle className="bg-gradient-to-r from-emerald-600 to-rose-600 bg-clip-text text-transparent">
          Revenue vs Expense
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#0d9488" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                <stop offset="100%" stopColor="#be123c" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} labelStyle={{ color: "white" }} itemStyle={{ color: "white" }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
            <Bar dataKey="revenue" fill="url(#revGrad)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expenses" fill="url(#expGrad)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PaymentSplitChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg dark:from-slate-900 dark:to-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700/50">
        <CardTitle className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
          Payment Method Split
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={splitColors[index % splitColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "white" }} itemStyle={{ color: "white" }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
