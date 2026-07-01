"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Shield, Key, Lock, UserCog } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/dashboard/page-header";

type Role = { id: string; name: string; permissions: string[] };

const availablePermissions = [
  "dashboard:view", "dashboard:read",
  "revenue:view", "revenue:read", "revenue:write",
  "expenses:view", "expenses:read", "expenses:write",
  "purchases:view", "purchases:read", "purchases:write",
  "dailyClosing:view", "dailyClosing:read", "dailyClosing:write",
  "reports:view", "reports:read", "reports:write",
  "users:view", "users:read", "users:write",
  "roles:view", "roles:read", "roles:write",
  "categories:view", "categories:read", "categories:write",
  "taxes:view", "taxes:read", "taxes:write",
  "stores:view", "stores:read", "stores:write",
  "companies:view", "companies:read", "companies:write",
];

const emptyForm = { name: "", permissions: [] as string[] };

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ id?: string; name: string; permissions: string[] }>(emptyForm);
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api<Role[]>("/roles") });

  const isEditing = Boolean(form.id);

  const saveRole = useMutation({
    mutationFn: () => {
      const payload = { name: form.name.toUpperCase(), permissions: form.permissions };
      if (form.id) return api(`/roles/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      return api("/roles", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      setForm(emptyForm);
      toast.success(isEditing ? "Role updated" : "Role created");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save role"),
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => api(`/roles/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete role"),
  });

  function editRole(role: Role) {
    setForm({ id: role.id, name: role.name, permissions: role.permissions });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveRole.mutate();
  }

  function togglePermission(perm: string) {
    setForm((curr) => {
      const perms = curr.permissions.includes(perm)
        ? curr.permissions.filter((p) => p !== perm)
        : [...curr.permissions, perm];
      return { ...curr, permissions: perms };
    });
  }

  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    const module = perm.split(":")[0];
    (acc[module] ??= []).push(perm);
    return acc;
  }, {} as Record<string, string[]>);

  const moduleColors: Record<string, string> = {
    dashboard: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    revenue: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    expenses: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    purchases: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    dailyClosing: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    reports: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    users: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-800",
    roles: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
    categories: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    taxes: "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-800",
    stores: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    companies: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage system roles and assign fine-grained permissions."
      />

      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-rose-500 via-pink-500 to-fuchsia-500" />
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
            <Key className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">{isEditing ? "Update Role" : "Add Role"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-semibold">Role Name</Label>
              <Input value={form.name} onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))} required />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">Permissions</Label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className={cn("rounded-xl border p-4", moduleColors[module])}>
                    <div className="mb-3 flex items-center gap-2 font-semibold capitalize">
                      <Lock className="h-4 w-4" />
                      {module.replace(/([A-Z])/g, " $1")}
                    </div>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <div key={perm} className="flex items-center gap-2">
                          <Checkbox id={perm} checked={form.permissions.includes(perm)} onCheckedChange={() => togglePermission(perm)} />
                          <label htmlFor={perm} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {perm.split(":")[1]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="gradient" disabled={saveRole.isPending}>{isEditing ? "Update Role" : "Add Role"}</Button>
              {isEditing && <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-violet-500 via-purple-500 to-indigo-500" />
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">Existing Roles</CardTitle>
          <p className="text-sm text-muted-foreground">Manage system roles and their assigned permissions.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Role Name</TableHead><TableHead>Permissions Count</TableHead><TableHead className="w-28">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(roles.data ?? []).map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", role.name === "PLATFORM_ADMIN" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                      <UserCog className="h-3 w-3" />
                      {role.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {role.permissions.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-sky-500 hover:bg-sky-500/10 hover:text-sky-600" onClick={() => editRole(role)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => deleteRole.mutate(role.id)} disabled={["PLATFORM_ADMIN", "OWNER", "ADMIN", "MANAGER", "EMPLOYEE"].includes(role.name)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
