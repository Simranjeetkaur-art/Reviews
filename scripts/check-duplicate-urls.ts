/**
 * Script to check for duplicate Google Maps URLs in the database
 * Run with: npx tsx scripts/check-duplicate-urls.ts
 */

import { PrismaClient } from "@prisma/client";
import { normalizeGoogleMapsUrl } from "../lib/url-normalizer";

const prisma = new PrismaClient();

interface DuplicateGroup {
  normalizedUrl: string;
  businesses: Array<{
    id: string;
    businessName: string;
    googleMapsUrl: string;
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
    isActive: boolean;
    createdAt: Date;
  }>;
}

async function checkDuplicateUrls() {
  console.log("🔍 Checking for duplicate Google Maps URLs...\n");

  try {
    // Fetch all active businesses
    const businesses = await prisma.business.findMany({
      where: {
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`📊 Total active businesses: ${businesses.length}\n`);

    // Group businesses by normalized URL
    const urlMap = new Map<string, DuplicateGroup>();

    for (const business of businesses) {
      const normalizedUrl = normalizeGoogleMapsUrl(business.googleMapsUrl);

      if (!urlMap.has(normalizedUrl)) {
        urlMap.set(normalizedUrl, {
          normalizedUrl,
          businesses: [],
        });
      }

      urlMap.get(normalizedUrl)!.businesses.push({
        id: business.id,
        businessName: business.businessName,
        googleMapsUrl: business.googleMapsUrl,
        ownerId: business.ownerId,
        ownerEmail: business.owner.email || "N/A",
        ownerName: business.owner.name || "N/A",
        isActive: business.isActive,
        createdAt: business.createdAt,
      });
    }

    // Find duplicates (groups with more than 1 business)
    const duplicates: DuplicateGroup[] = [];
    for (const group of urlMap.values()) {
      if (group.businesses.length > 1) {
        duplicates.push(group);
      }
    }

    if (duplicates.length === 0) {
      console.log("✅ No duplicate Google Maps URLs found!\n");
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate URL group(s):\n`);

    // Display duplicates
    for (let i = 0; i < duplicates.length; i++) {
      const group = duplicates[i];
      console.log(`\n${"=".repeat(80)}`);
      console.log(`Duplicate Group ${i + 1}: ${group.normalizedUrl}`);
      console.log(`Number of businesses: ${group.businesses.length}`);
      console.log(`${"=".repeat(80)}`);

      for (let j = 0; j < group.businesses.length; j++) {
        const business = group.businesses[j];
        console.log(`\n  Business ${j + 1}:`);
        console.log(`    ID: ${business.id}`);
        console.log(`    Name: ${business.businessName}`);
        console.log(`    Original URL: ${business.googleMapsUrl}`);
        console.log(
          `    Owner: ${business.ownerName} (${business.ownerEmail})`,
        );
        console.log(`    Owner ID: ${business.ownerId}`);
        console.log(`    Created: ${business.createdAt.toISOString()}`);
        console.log(`    Active: ${business.isActive}`);
      }
    }

    console.log(`\n\n📋 Summary:`);
    console.log(`   Total duplicate groups: ${duplicates.length}`);
    console.log(
      `   Total businesses with duplicates: ${duplicates.reduce((sum, g) => sum + g.businesses.length, 0)}`,
    );
    console.log(`\n💡 Recommendation:`);
    console.log(`   - Keep the oldest business (first created) active`);
    console.log(`   - Deactivate or reassign duplicate businesses`);
    console.log(
      `   - Use admin reassignment API to transfer businesses if needed`,
    );
    console.log(
      `\n⚠️  Action Required: Please resolve these duplicates to maintain data integrity.\n`,
    );

    return duplicates;
  } catch (error) {
    console.error("❌ Error checking for duplicates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDuplicateUrls()
  .then(() => {
    console.log("✅ Check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
