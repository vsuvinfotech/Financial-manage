"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Landmark, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";

type Company = { id: string; name: string; slug: string; createdAt: string; updatedAt: string };

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ id?: string; name: string; slug: string; ownerEmail?: string; ownerPassword?: string }>({
    name: "",
    slug: "",
    ownerEmail: "",
    ownerPassword: "",
  });
  const isEditing = Boolean(form.id);

  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: () => api<Company[]>("/companies"),
  });

  const saveCompany = useMutation({
    mutationFn: () => {
      if (form.id) {
        const payload = { name: form.name, slug: form.slug };
        return api(`/companies/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      const payload = {
        name: form.name,
        slug: form.slug,
        ownerEmail: form.ownerEmail,
        ownerPassword: form.ownerPassword,
      };
      return api("/companies", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      setForm({ name: "", slug: "", ownerEmail: "", ownerPassword: "" });
      toast.success(isEditing ? "Company updated" : "Company created");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save company"),
  });

  const deleteCompany = useMutation({
    mutationFn: (id: string) => api(`/companies/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete company"),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCompany.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description="Manage tenants and their default data." />

      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-amber-500 via-orange-500 to-rose-500" />
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
            <Landmark className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">{isEditing ? "Update Company" : "Add Company"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-semibold">Company Name</Label>
              <Input value={form.name} onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Slug (login URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm((curr) => ({ ...curr, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} required />
            </div>
            {!isEditing && (
              <>
                <div className="space-y-2">
                  <Label className="font-semibold">Owner Email</Label>
                  <Input type="email" value={form.ownerEmail} onChange={(e) => setForm((curr) => ({ ...curr, ownerEmail: e.target.value }))} required={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Owner Password</Label>
                  <Input type="password" value={form.ownerPassword} onChange={(e) => setForm((curr) => ({ ...curr, ownerPassword: e.target.value }))} required={!isEditing} />
                </div>
              </>
            )}
            <div className="flex gap-2 md:col-span-2">
              <Button variant="gradient" disabled={saveCompany.isPending}>
                {isEditing ? "Update" : "Add"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={() => setForm({ name: "", slug: "", ownerEmail: "", ownerPassword: "" })}>
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
          <CardTitle className="text-lg font-semibold">All Companies</CardTitle>
          <p className="text-sm text-muted-foreground">Platform-level tenant management.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(companies.data ?? []).map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.slug}</TableCell>
                  <TableCell>{new Date(company.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-sky-500 hover:bg-sky-500/10 hover:text-sky-600"
                        onClick={() => setForm({ id: company.id, name: company.name, slug: company.slug })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                        onClick={() => deleteCompany.mutate(company.id)}
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
