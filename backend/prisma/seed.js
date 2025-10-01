import pkg from '@prisma/client';
const { PrismaClient, RoleName, PermissionName } = pkg;
import bcrypt from 'bcryptjs'; // Ensure bcryptjs is a dev dependency

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create/verify default roles
  // This makes the script safe to run multiple times.
  const userRole = await prisma.role.upsert({
    where: { name: RoleName.USER },
    update: {},
    create: {
      name: RoleName.USER,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
    },
  });

  console.log('Created/verified default roles:', { userRole, adminRole });

  // 2. Create/verify all permissions from the schema
  // Use raw strings to avoid any enum import quirks
  const permissionsToCreate = [
    'CREATE_USER',
    'READ_USERS',
    'UPDATE_USER',
    'DELETE_USER',
    'READ_PROFILE',
    'CREATE_ITEM',
    'READ_ITEMS',
    'UPDATE_ITEM',
    'DELETE_ITEM',
  ].map(name => ({ name }));
  // Validate and upsert permissions sequentially for clearer error logging
  const allowedNames = new Set([
    'CREATE_USER','READ_USERS','UPDATE_USER','DELETE_USER','READ_PROFILE','CREATE_ITEM','READ_ITEMS','UPDATE_ITEM','DELETE_ITEM'
  ]);
  for (const permission of permissionsToCreate) {
    if (!permission || typeof permission.name !== 'string' || permission.name.trim() === '' || !allowedNames.has(permission.name)) {
      console.warn('Skipping invalid permission entry:', permission);
      continue;
    }
    console.log('Upserting permission:', permission.name);
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log('Created/verified permissions.');

  // 3. Define and assign permissions to roles
  const rolePermissions = {
    ADMIN: [
      PermissionName.CREATE_USER,
      PermissionName.READ_USERS,
      PermissionName.UPDATE_USER,
      PermissionName.DELETE_USER,
      PermissionName.READ_PROFILE,
      PermissionName.CREATE_ITEM,
      PermissionName.READ_ITEMS,
      PermissionName.UPDATE_ITEM,
      PermissionName.DELETE_ITEM,
    ],
    USER: [
      PermissionName.READ_PROFILE,
      PermissionName.READ_ITEMS,
    ],
  };

  for (const roleName of Object.keys(rolePermissions)) {
    const role = roleName === 'ADMIN' ? adminRole : userRole;
    const permissionsToAssign = await prisma.permission.findMany({
      where: { name: { in: rolePermissions[roleName] } },
    });

    await prisma.rolePermission.createMany({
      data: permissionsToAssign.map(p => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
    console.log(`Assigned ${permissionsToAssign.length} permissions to ${roleName} role.`);
  }

  // 2. Create a default admin user if credentials are provided in .env
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const adminUser = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {
        password: hashedPassword,
        roleId: adminRole.id,
      },
      create: {
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        roleId: adminRole.id,
      },
    });
    console.log('Created/verified admin user:', adminUser.email);
  } else {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set in .env, skipping admin user creation.');
  }

  // 3. Create a default normal user if credentials are provided in .env
  if (process.env.USER_EMAIL && process.env.USER_PASSWORD) {
    const hashedPassword = await bcrypt.hash(process.env.USER_PASSWORD, 12);
    const normalUser = await prisma.user.upsert({
      where: { email: process.env.USER_EMAIL },
      update: {
        password: hashedPassword,
        roleId: userRole.id,
      },
      create: {
        name: 'Normal User',
        email: process.env.USER_EMAIL,
        password: hashedPassword,
        roleId: userRole.id,
      },
    });
    console.log('Created/verified normal user:', normalUser.email);
  } else {
    console.warn('USER_EMAIL or USER_PASSWORD not set in .env, skipping normal user creation.');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

