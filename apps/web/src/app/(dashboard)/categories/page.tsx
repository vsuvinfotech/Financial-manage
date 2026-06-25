"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Tags, FolderOpen, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuthStore } from "@/stores/auth-store";

type CategoryType = "REVENUE" | "EXPENSE";
type Category = {
  id: string;
  name: string;
  type: CategoryType;
  isActive: boolean;
};

const categoryTypes: CategoryType[] = ["REVENUE", "EXPENSE"];
const emptyForm = { name: "", type: "REVENUE" as CategoryType, isActive: true };

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  const canWrite = permissions.includes("categories:write");

  const [form, setForm] = useState<{
    id?: string;
    name: string;
    type: CategoryType;
    isActive: boolean;
  }>(emptyForm);
  const [typeFilter, setTypeFilter] = useState<CategoryType | "ALL">("ALL");

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  const isEditing = Boolean(form.id);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        isActive: form.isActive,
      };
      if (form.id)
        return api(`/categories/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      return api("/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm(emptyForm);
      toast.success(isEditing ? "Category updated" : "Category created");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Unable to save category",
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category removed");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Unable to delete category",
      ),
  });

  function edit(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      type: category.type,
      isActive: category.isActive,
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    save.mutate();
  }

  const filtered = (categories.data ?? []).filter(
    (c) => typeFilter === "ALL" || c.type === typeFilter,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage the master list of categories used across revenue and expenses."
      />

      {canWrite && (
        <Card className="overflow-hidden border-0 shadow-md">
          <CardAccent className="from-violet-500 via-purple-500 to-fuchsia-500" />
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md">
              <Tags className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold">
              {isEditing ? "Update Category" : "Add Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-semibold">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((curr) => ({ ...curr, name: e.target.value }))
                  }
                  placeholder="e.g. TOBACCO"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((curr) => ({
                      ...curr,
                      type: value as CategoryType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(value) =>
                    setForm((curr) => ({ ...curr, isActive: Boolean(value) }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button variant="gradient" disabled={save.isPending}>
                  {isEditing ? "Update Category" : "Add Category"}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm(emptyForm)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-sky-500 via-blue-500 to-indigo-500" />
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
            <FolderOpen className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">Existing Categories</CardTitle>
          <p className="text-sm text-muted-foreground">Filter and manage the category list.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filter by type
            </Label>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as CategoryType | "ALL")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {categoryTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
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
                  <TableCell>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", category.type === "REVENUE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300")}>
                      {category.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                        category.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {category.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-sky-500 hover:bg-sky-500/10 hover:text-sky-600"
                          onClick={() => edit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                          onClick={() => remove.mutate(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canWrite ? 4 : 3}
                    className="py-8 text-center text-muted-foreground"
                  >
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
