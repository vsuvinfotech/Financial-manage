import { z } from "zod";

export const categoryTypeSchema = z.enum(["REVENUE", "EXPENSE", "PURCHASE"]);

export const listCategoriesQuerySchema = z.object({
  query: z.object({
    type: categoryTypeSchema.optional(),
    isActive: z
      .union([z.literal("true"), z.literal("false")])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    type: categoryTypeSchema,
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    type: categoryTypeSchema.optional(),
    isActive: z.boolean().optional(),
  }),
});

export const categoryParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
