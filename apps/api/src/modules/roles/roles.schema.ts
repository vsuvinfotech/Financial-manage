import { z } from "zod";

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    permissions: z.array(z.string()),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(2).optional(),
    permissions: z.array(z.string()).optional(),
  }),
});

export const roleParamsSchema = z.object({
  params: z.object({ id: z.string() }),
});
