import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import type { AppRole } from "../../config/permissions.js";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/http-error.js";

function signTokens(user: { id: string; email: string; role: string; name: string; permissions: string[] }) {
  const accessOptions: SignOptions = {};
  if (env.JWT_ACCESS_EXPIRES_IN) accessOptions.expiresIn = env.JWT_ACCESS_EXPIRES_IN as any;
  const accessToken = jwt.sign({ ...user, type: "access" }, env.JWT_ACCESS_SECRET, accessOptions);

  const refreshOptions: SignOptions = {};
  if (env.JWT_REFRESH_EXPIRES_IN) refreshOptions.expiresIn = env.JWT_REFRESH_EXPIRES_IN as any;
  const refreshToken = jwt.sign({ id: user.id, type: "refresh" }, env.JWT_REFRESH_SECRET, refreshOptions);

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: { name: string; email: string; password: string; role: AppRole }) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new HttpError(409, "Email already exists");
    const roleRecord = await prisma.role.findUnique({ where: { name: input.role } });
    if (!roleRecord) throw new HttpError(400, "Role not found");

    const password = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password, roleId: roleRecord.id },
      select: { id: true, name: true, email: true, role: { select: { name: true, permissions: true } } },
    });
    
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role.name, permissions: user.role.permissions };
    return { user: safeUser, ...signTokens(safeUser) };
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ 
      where: { email: input.email },
      include: { role: true }
    });
    if (!user) throw new HttpError(401, "Invalid credentials");
    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new HttpError(401, "Invalid credentials");
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role.name, permissions: user.role.permissions };
    return { user: safeUser, ...signTokens(safeUser) };
  },

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string; type: string };
      if (payload.type !== "refresh") throw new Error("Invalid token type");
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, name: true, email: true, role: { select: { name: true, permissions: true } } },
      });
      if (!user) throw new HttpError(401, "Invalid refresh token");
      const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role.name, permissions: user.role.permissions };
      return { user: safeUser, ...signTokens(safeUser) };
    } catch {
      throw new HttpError(401, "Invalid refresh token");
    }
  },
};
