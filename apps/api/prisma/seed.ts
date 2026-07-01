import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { platformAdminPermissions, seedTenantDefaults } from "../src/config/tenant-defaults.js";

const prisma = new PrismaClient();

async function main() {
  // 1) Platform-level system role + platform admin user (no company).
  // Null companyId can't be targeted via a compound unique, so use findFirst + create/update.
  const existingPlatformRole = await prisma.role.findFirst({
    where: { name: "PLATFORM_ADMIN", companyId: null },
  });
  const platformRole = existingPlatformRole
    ? await prisma.role.update({
        where: { id: existingPlatformRole.id },
        data: { permissions: platformAdminPermissions },
      })
    : await prisma.role.create({
        data: { name: "PLATFORM_ADMIN", permissions: platformAdminPermissions, companyId: null },
      });

  const platformPassword = await bcrypt.hash("Platform@12345", 12);
  const existingPlatformUser = await prisma.user.findFirst({
    where: { email: "admin@platform.local", companyId: null },
  });
  if (existingPlatformUser) {
    await prisma.user.update({
      where: { id: existingPlatformUser.id },
      data: { roleId: platformRole.id },
    });
  } else {
    await prisma.user.create({
      data: {
        name: "Platform Admin",
        email: "admin@platform.local",
        password: platformPassword,
        roleId: platformRole.id,
        companyId: null,
      },
    });
  }

  // 2) Demo tenant (Company) with default roles + categories.
  const company = await prisma.company.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Demo Company", slug: "demo" },
  });
  await seedTenantDefaults(prisma, company.id);

  // 3) Two stores for the demo company.
  const store1 = await prisma.store.upsert({
    where: { name_companyId: { name: "Store 1", companyId: company.id } },
    update: {},
    create: { name: "Store 1", companyId: company.id },
  });
  await prisma.store.upsert({
    where: { name_companyId: { name: "Store 2", companyId: company.id } },
    update: {},
    create: { name: "Store 2", companyId: company.id },
  });

  // 4) Demo OWNER user (OWNER implicitly has access to all stores in the company).
  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: { name_companyId: { name: "OWNER", companyId: company.id } },
  });
  const ownerPassword = await bcrypt.hash("Owner@12345", 12);
  await prisma.user.upsert({
    where: { email_companyId: { email: "owner@demo.local", companyId: company.id } },
    update: { roleId: ownerRole.id },
    create: {
      name: "Demo Owner",
      email: "owner@demo.local",
      password: ownerPassword,
      roleId: ownerRole.id,
      companyId: company.id,
    },
  });

  // 5) Demo EMPLOYEE scoped to Store 1 only (demonstrates UserStoreAccess).
  const employeeRole = await prisma.role.findUniqueOrThrow({
    where: { name_companyId: { name: "EMPLOYEE", companyId: company.id } },
  });
  const employeePassword = await bcrypt.hash("Employee@12345", 12);
  const employee = await prisma.user.upsert({
    where: { email_companyId: { email: "employee@demo.local", companyId: company.id } },
    update: { roleId: employeeRole.id },
    create: {
      name: "Demo Employee",
      email: "employee@demo.local",
      password: employeePassword,
      roleId: employeeRole.id,
      companyId: company.id,
    },
  });
  await prisma.userStoreAccess.upsert({
    where: { userId_storeId: { userId: employee.id, storeId: store1.id } },
    update: {},
    create: { userId: employee.id, storeId: store1.id },
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
