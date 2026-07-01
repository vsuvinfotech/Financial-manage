import { z } from "zod";

const slug = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Slug must be lowercase alphanumeric with dashes");

export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug,
    isActive: z.boolean().optional(),
    ownerEmail: z.string().email(),
    ownerPassword: z.string().min(8),
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: slug.optional(),
    isActive: z.boolean().optional(),
  }),
});

export const companyParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
