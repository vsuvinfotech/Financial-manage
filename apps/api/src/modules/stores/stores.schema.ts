import { z } from "zod";

export const listStoresQuerySchema = z.object({
  query: z.object({
    companyId: z.string().optional(),
    isActive: z
      .union([z.literal("true"), z.literal("false")])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
});

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    isActive: z.boolean().optional(),
    // Platform admins may create stores for a specific company.
    companyId: z.string().optional(),
  }),
});

export const updateStoreSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const storeParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
