import { z } from "zod";
import { roleSchema } from "../auth/auth.schema.js";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: roleSchema.default("EMPLOYEE"),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: roleSchema.optional(),
  }),
});

export const userParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
