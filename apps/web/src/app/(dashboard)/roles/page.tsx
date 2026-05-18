"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">Manage system roles and assign fine-grained permissions.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{isEditing ? "Update Role" : "Add Role"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input value={form.name} onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))} required />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {availablePermissions.map((perm) => (
                  <div key={perm} className="flex items-center space-x-2">
                    <Checkbox id={perm} checked={form.permissions.includes(perm)} onCheckedChange={() => togglePermission(perm)} />
                    <label htmlFor={perm} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {perm}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button disabled={saveRole.isPending}>{isEditing ? "Update Role" : "Add Role"}</Button>
              {isEditing && <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing Roles</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Role Name</TableHead><TableHead>Permissions Count</TableHead><TableHead className="w-28">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(roles.data ?? []).map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.permissions.length} permissions</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => editRole(role)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteRole.mutate(role.id)} disabled={["SUPERADMIN", "ADMIN", "MANAGER", "EMPLOYEE"].includes(role.name)}><Trash2 className="h-4 w-4" /></Button>
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
