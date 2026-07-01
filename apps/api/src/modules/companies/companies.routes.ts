import { Router } from "express";
import { hash } from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { seedTenantDefaults } from "../../config/tenant-defaults.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import {
  companyParamsSchema,
  createCompanySchema,
  updateCompanySchema,
} from "./companies.schema.js";

export const companiesRoutes = Router();

// Company administration is platform-level only.
companiesRoutes.use(authenticate, authorize("PLATFORM_ADMIN"));

companiesRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { stores: true, users: true } } },
    });
    res.json(companies);
  }),
);

companiesRoutes.post(
  "/",
  validate(createCompanySchema),
  asyncHandler(async (req, res) => {
    const exists = await prisma.company.findFirst({
      where: { OR: [{ name: req.body.name }, { slug: req.body.slug }] },
    });
    if (exists) throw new HttpError(409, "Company name or slug already exists");

    const company = await prisma.company.create({
      data: { name: req.body.name, slug: req.body.slug, isActive: req.body.isActive ?? true },
    });
    // Provision default roles + categories for the new tenant.
    await seedTenantDefaults(prisma, company.id);

    const ownerRole = await prisma.role.findFirst({
      where: { name: "OWNER", companyId: company.id },
    });
    if (!ownerRole) throw new HttpError(500, "Owner role not created");

    const existingOwner = await prisma.user.findFirst({
      where: { email: req.body.ownerEmail, companyId: company.id },
    });
    if (existingOwner) throw new HttpError(409, "Owner email already exists for this company");

    const passwordHash = await hash(req.body.ownerPassword, 10);
    const owner = await prisma.user.create({
      data: {
        name: "Owner",
        email: req.body.ownerEmail,
        password: passwordHash,
        roleId: ownerRole.id,
        companyId: company.id,
      },
      select: { id: true, name: true, email: true, roleId: true, companyId: true },
    });

    res.status(201).json({ company, owner });
  }),
);

companiesRoutes.put(
  "/:id",
  validate(updateCompanySchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Company not found");

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.slug !== undefined ? { slug: req.body.slug } : {}),
        ...(req.body.isActive !== undefined ? { isActive: req.body.isActive } : {}),
      },
    });
    res.json(company);
  }),
);

companiesRoutes.delete(
  "/:id",
  validate(companyParamsSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Company not found");
    await prisma.company.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
