import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { isPlatformAdmin } from "../../config/permissions.js";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/http-error.js";

type SafeUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  permissions: string[];
  companyId: string | null;
  companySlug: string | null;
  allowedStoreIds: string[];
};

function signTokens(user: SafeUser) {
  const accessOptions: SignOptions = {};
  if (env.JWT_ACCESS_EXPIRES_IN) accessOptions.expiresIn = env.JWT_ACCESS_EXPIRES_IN as any;
  const accessToken = jwt.sign({ ...user, type: "access" }, env.JWT_ACCESS_SECRET, accessOptions);

  const refreshOptions: SignOptions = {};
  if (env.JWT_REFRESH_EXPIRES_IN) refreshOptions.expiresIn = env.JWT_REFRESH_EXPIRES_IN as any;
  const refreshToken = jwt.sign({ id: user.id, type: "refresh" }, env.JWT_REFRESH_SECRET, refreshOptions);

  return { accessToken, refreshToken };
}

/**
 * Loads a user with role + company, computing the set of stores they may access.
 * OWNER/ADMIN (and any user) implicitly get all active stores in their company;
 * other roles are limited to their explicit UserStoreAccess grants.
 */
async function buildSafeUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, company: true, storeAccess: true },
  });
  if (!user) throw new HttpError(401, "Invalid credentials");

  let allowedStoreIds: string[] = [];
  if (!isPlatformAdmin(user.role.name) && user.companyId) {
    if (user.role.name === "OWNER" || user.role.name === "ADMIN") {
      const stores = await prisma.store.findMany({
        where: { companyId: user.companyId, isActive: true },
        select: { id: true },
      });
      allowedStoreIds = stores.map((s) => s.id);
    } else {
      allowedStoreIds = user.storeAccess.map((a) => a.storeId);
    }
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role.name,
    name: user.name,
    permissions: user.role.permissions,
    companyId: user.companyId,
    companySlug: user.company?.slug ?? null,
    allowedStoreIds,
  };
}

export const authService = {
  async register(input: { name: string; email: string; password: string; role: string; companyId: string | null }) {
    // findFirst (not findUnique) so a null companyId is a valid filter for platform users.
    const roleRecord = await prisma.role.findFirst({
      where: { name: input.role, companyId: input.companyId },
    });
    if (!roleRecord) throw new HttpError(400, "Role not found");

    const exists = await prisma.user.findFirst({
      where: { email: input.email, companyId: input.companyId },
    });
    if (exists) throw new HttpError(409, "Email already exists");

    const password = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password, roleId: roleRecord.id, companyId: input.companyId },
    });
    const safeUser = await buildSafeUser(user.id);
    return { user: safeUser, ...signTokens(safeUser) };
  },

  async login(input: { email: string; password: string; companySlug?: string }) {
    // Resolve tenant: platform users have companyId = null; tenant users are matched
    // by email within their company (identified via the X-Tenant-Slug header).
    const companyId = input.companySlug
      ? (await prisma.company.findUnique({ where: { slug: input.companySlug } }))?.id ?? null
      : null;

    const candidates = await prisma.user.findMany({
      where: { email: input.email, ...(input.companySlug ? { companyId } : {}) },
      include: { role: true },
    });

    // Prefer a company-scoped match; otherwise fall back to a platform (null company) user.
    const user =
      candidates.find((u) => u.companyId === companyId) ??
      candidates.find((u) => u.companyId === null) ??
      candidates[0];
    if (!user) throw new HttpError(401, "Invalid credentials");

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new HttpError(401, "Invalid credentials");

    const safeUser = await buildSafeUser(user.id);
    return { user: safeUser, ...signTokens(safeUser) };
  },

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string; type: string };
      if (payload.type !== "refresh") throw new Error("Invalid token type");
      const safeUser = await buildSafeUser(payload.id);
      return { user: safeUser, ...signTokens(safeUser) };
    } catch {
      throw new HttpError(401, "Invalid refresh token");
    }
  },
};
