"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Store, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";

type Store = { id: string; name: string; companyId: string; createdAt: string; updatedAt: string };

export default function StoresPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<{ id?: string; name: string }>({ name: "" });
  const isEditing = Boolean(form.id);

  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: () => api<Store[]>("/stores"),
  });

  const saveStore = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = { name: form.name };
      if (user?.role === "PLATFORM_ADMIN" && !user?.companyId) {
        // Platform admins managing stores should pick a company; default to query param if needed.
        // For simplicity, we rely on the backend to reject if ambiguous.
      }
      if (form.id) return api(`/stores/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      return api("/stores", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["stores"] });
      setForm({ name: "" });
      toast.success(isEditing ? "Store updated" : "Store created");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save store"),
  });

  const deleteStore = useMutation({
    mutationFn: (id: string) => api(`/stores/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Store deleted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete store"),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveStore.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Stores" description="Manage the stores within your company." />

      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-cyan-500 via-blue-500 to-indigo-500" />
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md">
            <Store className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">{isEditing ? "Update Store" : "Add Store"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label className="font-semibold">Store Name</Label>
              <Input value={form.name} onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))} required />
            </div>
            <div className="flex gap-2">
              <Button variant="gradient" disabled={saveStore.isPending}>
                {isEditing ? "Update" : "Add"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={() => setForm({ name: "" })}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-indigo-500 via-purple-500 to-pink-500" />
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Stores</CardTitle>
          <p className="text-sm text-muted-foreground">Stores are scoped to your company.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stores.data ?? []).map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{new Date(store.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-sky-500 hover:bg-sky-500/10 hover:text-sky-600"
                        onClick={() => setForm({ id: store.id, name: store.name })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                        onClick={() => deleteStore.mutate(store.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
