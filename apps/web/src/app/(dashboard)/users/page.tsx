"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Users, Shield, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { roleRank } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";

type Role = string;
type User = { id: string; name: string; email: string; role: Role; createdAt: string; updatedAt: string };
type RolePermissions = { id: string; name: string; permissions: string[] };
type FormState = { id?: string; name: string; email: string; password: string; role: Role };

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const currentUser = useAuthStore((state) => state.user);
  const users = useQuery({ queryKey: ["users"], queryFn: () => api<User[]>("/users") });
  const roleMatrix = useQuery({ queryKey: ["roles"], queryFn: () => api<RolePermissions[]>("/roles") });

  const isEditing = Boolean(form.id);
  const groupedPermissions = useMemo(() => {
    return (roleMatrix.data ?? []).map((item) => ({
      ...item,
      view: item.permissions.filter((permission) => permission.endsWith(":view")).length,
      read: item.permissions.filter((permission) => permission.endsWith(":read")).length,
      write: item.permissions.filter((permission) => permission.endsWith(":write")).length,
    }));
  }, [roleMatrix.data]);

  const saveUser = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) payload.password = form.password;
      if (form.id) return api(`/users/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      return api("/users", { method: "POST", body: JSON.stringify({ ...payload, password: form.password }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setForm(emptyForm);
      toast.success(isEditing ? "User updated" : "User created");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save user"),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api(`/users/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete user"),
  });

  function editUser(user: User) {
    setForm({ id: user.id, name: user.name, email: user.email, password: "", role: user.role });
  }

  function canManage(user: User) {
    if (!currentUser) return false;
    if (currentUser.role === "SUPERADMIN") return true;
    const actorRank = roleRank[currentUser.role as keyof typeof roleRank] || 0;
    const targetRank = roleRank[user.role as keyof typeof roleRank] || 0;
    return actorRank > targetRank && user.role !== "SUPERADMIN";
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEditing && form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    saveUser.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Permissions"
        description="Create users, assign roles, and review read, write, and view access."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden border-0 shadow-md">
          <CardAccent className="from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold">{isEditing ? "Update User" : "Add User"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-semibold">Name</Label>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Email</Label>
                <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{isEditing ? "New Password" : "Password"}</Label>
                <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={isEditing ? "Leave blank to keep current" : ""} required={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as Role }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(roleMatrix.data ?? []).map((roleItem) => <SelectItem key={roleItem.name} value={roleItem.name}>{roleItem.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button variant="gradient" disabled={saveUser.isPending}>{isEditing ? "Update User" : "Add User"}</Button>
                {isEditing && <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md">
          <CardAccent className="from-amber-500 via-orange-500 to-rose-500" />
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold">Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Role</TableHead><TableHead>View</TableHead><TableHead>Read</TableHead><TableHead>Write</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {groupedPermissions.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", item.name === "SUPERADMIN" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                        {item.name === "SUPERADMIN" && <Crown className="h-3 w-3" />}
                        {item.name}
                      </span>
                    </TableCell>
                    <TableCell><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">{item.view}</span></TableCell>
                    <TableCell><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">{item.read}</span></TableCell>
                    <TableCell><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{item.write}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-sky-500 via-blue-500 to-indigo-500" />
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">Team Members</CardTitle>
          <p className="text-sm text-muted-foreground">Manage users and their access levels.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Updated</TableHead><TableHead className="w-28">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(users.data ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", user.role === "SUPERADMIN" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : user.role === "ADMIN" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : user.role === "MANAGER" ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-sky-500 hover:bg-sky-500/10 hover:text-sky-600" onClick={() => editUser(user)} disabled={!canManage(user)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => deleteUser.mutate(user.id)} disabled={!canManage(user) || user.id === currentUser?.id}><Trash2 className="h-4 w-4" /></Button>
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
