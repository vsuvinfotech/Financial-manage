"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { roleRank } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      <div>
        <h1 className="text-2xl font-semibold">Users & Permissions</h1>
        <p className="text-sm text-muted-foreground">Create users, assign roles, and review read, write, and view access.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader><CardTitle>{isEditing ? "Update User" : "Add User"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>{isEditing ? "New Password" : "Password"}</Label>
                <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={isEditing ? "Leave blank to keep current" : ""} required={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as Role }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(roleMatrix.data ?? []).map((roleItem) => <SelectItem key={roleItem.name} value={roleItem.name}>{roleItem.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button disabled={saveUser.isPending}>{isEditing ? "Update User" : "Add User"}</Button>
                {isEditing && <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Permission Matrix</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Role</TableHead><TableHead>View</TableHead><TableHead>Read</TableHead><TableHead>Write</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {groupedPermissions.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.view}</TableCell>
                    <TableCell>{item.read}</TableCell>
                    <TableCell>{item.write}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
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
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{new Date(user.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => editUser(user)} disabled={!canManage(user)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteUser.mutate(user.id)} disabled={!canManage(user) || user.id === currentUser?.id}><Trash2 className="h-4 w-4" /></Button>
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
