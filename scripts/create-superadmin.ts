import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || "admin@reviewboost.com";
  const password = process.env.SUPERADMIN_PASSWORD || "admin123";
  const name = "Super Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "superadmin",
      subscriptionTier: "admin",
      subscriptionStatus: "active",
      businessLimit: -1,
      feedbackLimit: -1,
      subscriptionType: null,
      paymentType: null,
    },
    create: {
      email,
      passwordHash,
      name,
      role: "superadmin",
      subscriptionTier: "admin",
      subscriptionStatus: "active",
      businessLimit: -1,
      feedbackLimit: -1,
      subscriptionType: null,
      paymentType: null,
    },
  });

  console.log("Super admin created/updated:");
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  Tier: ${user.subscriptionTier}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
