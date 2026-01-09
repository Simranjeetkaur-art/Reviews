/**
 * Script to help resolve duplicate Google Maps URLs
 * This script identifies duplicates and provides options to deactivate or reassign them
 *
 * Usage:
 *   npx tsx scripts/resolve-duplicates.ts --dry-run  (preview changes)
 *   npx tsx scripts/resolve-duplicates.ts --resolve   (actually resolve)
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

async function resolveDuplicates(dryRun: boolean = true) {
  console.log(
    dryRun
      ? "🔍 DRY RUN MODE - No changes will be made\n"
      : "⚠️  RESOLVING DUPLICATES - Changes will be made\n",
  );

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

    // Find duplicates
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

    console.log(`⚠️  Found ${duplicates.length} duplicate URL group(s)\n`);

    let totalResolved = 0;

    // Resolve each duplicate group
    for (const group of duplicates) {
      // Sort by creation date (oldest first)
      const sorted = [...group.businesses].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      // Keep the oldest one, deactivate the rest
      const keepBusiness = sorted[0];
      const deactivateBusinesses = sorted.slice(1);

      console.log(`\n${"=".repeat(80)}`);
      console.log(`Duplicate Group: ${group.normalizedUrl}`);
      console.log(`${"=".repeat(80)}`);
      console.log(`\n✅ KEEPING (oldest):`);
      console.log(`   Business: ${keepBusiness.businessName}`);
      console.log(`   ID: ${keepBusiness.id}`);
      console.log(
        `   Owner: ${keepBusiness.ownerName} (${keepBusiness.ownerEmail})`,
      );
      console.log(`   Created: ${keepBusiness.createdAt.toISOString()}`);

      console.log(
        `\n❌ DEACTIVATING (${deactivateBusinesses.length} business/es):`,
      );
      for (const business of deactivateBusinesses) {
        console.log(`   - ${business.businessName} (ID: ${business.id})`);
        console.log(
          `     Owner: ${business.ownerName} (${business.ownerEmail})`,
        );
        console.log(`     Created: ${business.createdAt.toISOString()}`);

        if (!dryRun) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              isActive: false,
              deletedAt: new Date(),
            },
          });
          console.log(`     ✅ Deactivated`);
        } else {
          console.log(`     🔍 Would deactivate (dry run)`);
        }
      }

      totalResolved += deactivateBusinesses.length;
    }

    console.log(`\n\n📋 Summary:`);
    console.log(`   Duplicate groups found: ${duplicates.length}`);
    console.log(`   Businesses to deactivate: ${totalResolved}`);

    if (dryRun) {
      console.log(
        `\n💡 This was a dry run. To actually resolve duplicates, run:`,
      );
      console.log(`   npx tsx scripts/resolve-duplicates.ts --resolve\n`);
    } else {
      console.log(`\n✅ Duplicates resolved successfully!\n`);
    }
  } catch (error) {
    console.error("❌ Error resolving duplicates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes("--resolve");

// Run the resolution
resolveDuplicates(dryRun)
  .then(() => {
    console.log("✅ Process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Process failed:", error);
    process.exit(1);
  });
