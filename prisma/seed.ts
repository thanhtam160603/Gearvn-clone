import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const email = "demo@gearvn.local";
  const passwordHash = await bcrypt.hash("Demo@123", 12);

  await prisma.user.upsert({
    where: { email },
    update: { displayName: "Demo Customer", passwordHash },
    create: {
      email,
      passwordHash,
      displayName: "Demo Customer",
      role: "CUSTOMER",
    },
  });

  console.log(`Seeded development user: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Database seed failed.");
    await prisma.$disconnect();
    throw error;
  });