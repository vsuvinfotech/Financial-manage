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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/stores/auth-store";

type CategoryType = "REVENUE" | "EXPENSE" | "PURCHASE";
type Category = { id: string; name: string; type: CategoryType; isActive: boolean };

const categoryTypes: CategoryType[] = ["REVENUE", "EXPENSE", "PURCHASE"];
const emptyForm = { name: "", type: "REVENUE" as CategoryType, isActive: true };

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  const canWrite = permissions.includes("categories:write");

  const [form, setForm] = useState<{ id?: string; name: string; type: CategoryType; isActive: boolean }>(emptyForm);
  const [typeFilter, setTypeFilter] = useState<CategoryType | "ALL">("ALL");

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  const isEditing = Boolean(form.id);

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: form.name.trim(), type: form.type, isActive: form.isActive };
      if (form.id) return api(`/categories/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      return api("/categories", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm(emptyForm);
      toast.success(isEditing ? "Category updated" : "Category created");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save category"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category removed");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete category"),
  });

  function edit(category: Category) {
    setForm({ id: category.id, name: category.name, type: category.type, isActive: category.isActive });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    save.mutate();
  }

  const filtered = (categories.data ?? []).filter((c) => typeFilter === "ALL" || c.type === typeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Manage the master list of categories used across revenue, expenses, and purchases.
        </p>
      </div>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Update Category" : "Add Category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
                  placeholder="e.g. TOBACCO"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm((curr) => ({ ...curr, type: value as CategoryType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(value) => setForm((curr) => ({ ...curr, isActive: Boolean(value) }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button disabled={save.isPending}>{isEditing ? "Update Category" : "Add Category"}</Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs uppercase text-muted-foreground">Filter by type</Label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as CategoryType | "ALL")}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {categoryTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {canWrite && <TableHead className="w-28">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.type}</TableCell>
                  <TableCell>
                    <span className={category.isActive ? "text-emerald-600" : "text-muted-foreground"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => edit(category)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(category.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canWrite ? 4 : 3} className="text-center text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
