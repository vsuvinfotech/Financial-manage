import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superAdminPermissions = [
    "dashboard:view", "dashboard:read",
    "revenue:view", "revenue:read", "revenue:write",
    "expenses:view", "expenses:read", "expenses:write",
    "purchases:view", "purchases:read", "purchases:write",
    "dailyClosing:view", "dailyClosing:read", "dailyClosing:write",
    "reports:view", "reports:read", "reports:write",
    "users:view", "users:read", "users:write",
    "roles:view", "roles:read", "roles:write",
  ];

  const adminPermissions = [
    "dashboard:view", "dashboard:read",
    "revenue:view", "revenue:read", "revenue:write",
    "expenses:view", "expenses:read", "expenses:write",
    "purchases:view", "purchases:read", "purchases:write",
    "dailyClosing:view", "dailyClosing:read", "dailyClosing:write",
    "reports:view", "reports:read",
  ];

  const managerPermissions = [
    "dashboard:view", "dashboard:read",
    "revenue:view", "revenue:read", "revenue:write",
    "expenses:view", "expenses:read", "expenses:write",
    "purchases:view", "purchases:read", "purchases:write",
    "dailyClosing:view", "dailyClosing:read", "dailyClosing:write",
    "reports:view", "reports:read",
  ];

  const employeePermissions = [
    "dashboard:view", "revenue:view", "revenue:read", "revenue:write",
    "expenses:view", "expenses:read", "expenses:write",
    "purchases:view", "purchases:read", "purchases:write",
  ];

  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPERADMIN" },
    update: { permissions: superAdminPermissions },
    create: { name: "SUPERADMIN", permissions: superAdminPermissions },
  });

  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: { permissions: adminPermissions },
    create: { name: "ADMIN", permissions: adminPermissions },
  });

  await prisma.role.upsert({
    where: { name: "MANAGER" },
    update: { permissions: managerPermissions },
    create: { name: "MANAGER", permissions: managerPermissions },
  });

  await prisma.role.upsert({
    where: { name: "EMPLOYEE" },
    update: { permissions: employeePermissions },
    create: { name: "EMPLOYEE", permissions: employeePermissions },
  });

  const password = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@store.local" },
    update: { roleId: superAdminRole.id },
    create: {
      name: "Store Admin",
      email: "admin@store.local",
      password,
      roleId: superAdminRole.id,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
