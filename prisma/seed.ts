// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@local.test";
  const passwordHash = await bcrypt.hash("Admin#12345", 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // Base categories
  const home = await prisma.serviceCategory.upsert({
    where: { slug: "home-services" },
    update: {},
    create: { name: "Home Services", slug: "home-services" },
  });

  // Base services
  const services = [
    { name: "Electrician", slug: "electrician" },
    { name: "Auto Mechanic", slug: "auto-mechanic" },
    { name: "House Washing", slug: "house-washing" },
    { name: "Laundry/Washing", slug: "laundry" },
    { name: "Water Line / Plumbing", slug: "plumbing" },
    { name: "Bathroom Cleaning", slug: "bathroom-clean" },
    { name: "Driver", slug: "driver" },
    { name: "Domestic Help", slug: "domestic-help" },
    { name: "Lock Repair", slug: "lock-repair" },
    { name: "Carry Van / Moving", slug: "moving" },
    { name: "Painting", slug: "painting" },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { isActive: true, categoryId: home.id },
      create: {
        name: s.name,
        slug: s.slug,
        categoryId: home.id,
        basePrice: "0",
        unit: "per job",
      },
    });
  }

  console.log({ admin: admin.email, services: services.length });
}

main().finally(() => prisma.$disconnect());
