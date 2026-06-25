import { z } from "zod";

export const paymentMethodSchema = z.enum(["CASH", "CARD"]);
export const categoryNameSchema = z.string().min(1).max(60);

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const entryBase = {
  amount: z.coerce.number().positive(),
  paymentMethod: paymentMethodSchema,
  notes: z.string().max(500).optional().nullable(),
  date: z.coerce.date(),
};

export const revenueCreateSchema = z.object({
  body: z.object({
    ...entryBase,
    category: categoryNameSchema,
  }),
});
export const revenueUpdateSchema = z.object({
  body: revenueCreateSchema.shape.body.partial(),
});

export const expenseCreateSchema = z.object({
  body: z.object({
    ...entryBase,
    expenseType: categoryNameSchema,
  }),
});
export const expenseUpdateSchema = z.object({
  body: expenseCreateSchema.shape.body.partial(),
});

export const purchaseCreateSchema = z.object({
  body: z.object({
    ...entryBase,
    vendorName: z.string().min(2),
    category: categoryNameSchema,
  }),
});
export const purchaseUpdateSchema = z.object({
  body: purchaseCreateSchema.shape.body.partial(),
});

export const idParamsSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
