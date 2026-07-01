import { z } from "zod";

export const roleSchema = z.enum(["PLATFORM_ADMIN", "OWNER", "ADMIN", "MANAGER", "EMPLOYEE"]);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: roleSchema.default("EMPLOYEE"),
    companyId: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});
