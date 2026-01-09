import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo user
  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      passwordHash: "demo-hash", // In production, use proper password hashing
      name: "Demo User",
      role: "owner",
    },
  });

  console.log("✅ Created demo user:", user.email);

  // Create a demo business
  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      businessName: "Joe's Coffee Shop",
      businessType: "Coffee Shop",
      googleMapsUrl:
        "https://www.google.com/maps/search/?api=1&query=coffee+shop",
      products: {
        create: [
          { name: "Cappuccino", category: "Coffee" },
          { name: "Latte", category: "Coffee" },
          { name: "Espresso", category: "Coffee" },
          { name: "Croissant", category: "Pastry" },
          { name: "Muffin", category: "Pastry" },
        ],
      },
      employees: {
        create: [
          { name: "Sarah", role: "Barista" },
          { name: "Mike", role: "Manager" },
        ],
      },
    },
  });

  console.log("✅ Created demo business:", business.businessName);

  // Create sample feedbacks
  const sampleFeedbacks = [
    {
      content:
        "Amazing coffee at Joe's Coffee Shop! The cappuccino was perfectly crafted with beautiful latte art. Sarah, the barista, was incredibly friendly and knowledgeable. The atmosphere is cozy and inviting. Highly recommend!",
      sentiment: "positive",
      category: "Coffee",
    },
    {
      content:
        "Great experience! The espresso here is top-notch, and the croissants are fresh and flaky. Mike provided excellent service and made sure we had everything we needed. Will definitely be back!",
      sentiment: "positive",
      category: "Coffee",
    },
    {
      content:
        "Love this place! The lattes are consistently delicious, and the staff is always welcoming. The pastries are a perfect complement to the coffee. One of my favorite spots in town!",
      sentiment: "positive",
      category: "Coffee",
    },
    {
      content:
        "Solid coffee shop with good drinks and friendly service. The cappuccino was well-made, though the wait time was a bit longer than expected. Overall, a nice place to grab coffee.",
      sentiment: "neutral",
      category: "Coffee",
    },
    {
      content:
        "Decent coffee and pastries. The atmosphere is pleasant and the staff is helpful. Prices are reasonable for the quality. A reliable option for a quick coffee break.",
      sentiment: "neutral",
      category: "General",
    },
    {
      content:
        "Fantastic local coffee shop! The quality of the coffee beans is evident in every cup. Sarah always remembers my order and greets me with a smile. The muffins are homemade and delicious!",
      sentiment: "positive",
      category: "Pastry",
    },
    {
      content:
        "Best coffee in the area! The espresso is rich and smooth, and the croissants are buttery perfection. The team here clearly takes pride in their work. Five stars!",
      sentiment: "positive",
      category: "Coffee",
    },
    {
      content:
        "Nice coffee shop with a good selection. The latte was tasty and the service was friendly. The seating area could use a bit more space, but overall a good experience.",
      sentiment: "neutral",
      category: "Coffee",
    },
    {
      content:
        "Wonderful neighborhood gem! The coffee is expertly prepared, and the staff goes above and beyond. Mike recommended the perfect pastry to pair with my cappuccino. Absolutely love it here!",
      sentiment: "positive",
      category: "Coffee",
    },
    {
      content:
        "Great coffee and friendly atmosphere. The baristas are skilled and the drinks are consistently good. The pastries are fresh daily. A must-visit for coffee lovers!",
      sentiment: "positive",
      category: "General",
    },
    {
      content:
        "Good coffee shop with reliable quality. The espresso drinks are well-prepared and the staff is courteous. A solid choice for your daily coffee fix.",
      sentiment: "neutral",
      category: "Coffee",
    },
    {
      content:
        "Outstanding service and delicious coffee! Sarah's recommendations are always spot-on. The cozy ambiance makes it perfect for working or catching up with friends. Highly recommend Joe's!",
      sentiment: "positive",
      category: "General",
    },
  ];

  for (const feedback of sampleFeedbacks) {
    await prisma.feedback.create({
      data: {
        businessId: business.id,
        ...feedback,
        isActive: true,
      },
    });
  }

  console.log(`✅ Created ${sampleFeedbacks.length} sample feedbacks`);
  console.log("\n🎉 Seeding complete!");
  console.log(`\n📋 Demo Business ID: ${business.id}`);
  console.log(
    `🔗 Customer Review URL: http://localhost:3004/review/${business.id}`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
