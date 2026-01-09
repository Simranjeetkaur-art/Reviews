import { prisma } from "@/lib/prisma";
import { normalizeGoogleMapsUrl } from "@/lib/url-normalizer";

interface DuplicateGroup {
  normalizedUrl: string;
  businesses: Array<{
    id: string;
    businessName: string;
    googleMapsUrl: string;
    ownerId: string;
    ownerEmail: string;
    createdAt: Date;
    isActive: boolean;
  }>;
}

async function detectDuplicates(): Promise<DuplicateGroup[]> {
  // Get all active businesses
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  // Group by normalized URL
  const urlMap = new Map<string, typeof businesses>();

  for (const business of businesses) {
    const normalized =
      business.normalizedGoogleMapsUrl ||
      normalizeGoogleMapsUrl(business.googleMapsUrl);
    if (!urlMap.has(normalized)) {
      urlMap.set(normalized, []);
    }
    urlMap.get(normalized)!.push(business);
  }

  // Find duplicates (groups with more than 1 business)
  const duplicates: DuplicateGroup[] = [];
  for (const [normalizedUrl, businesses] of urlMap.entries()) {
    if (businesses.length > 1) {
      duplicates.push({
        normalizedUrl,
        businesses: businesses.map((b) => ({
          id: b.id,
          businessName: b.businessName,
          googleMapsUrl: b.googleMapsUrl,
          ownerId: b.owner.id,
          ownerEmail: b.owner.email,
          createdAt: b.createdAt,
          isActive: b.isActive,
        })),
      });
    }
  }

  return duplicates;
}

async function resolveDuplicates(dryRun: boolean = true) {
  const duplicates = await detectDuplicates();

  console.log(`Found ${duplicates.length} duplicate URL groups`);

  for (const group of duplicates) {
    // Sort by creation date (oldest first)
    const sorted = group.businesses.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const keep = sorted[0]; // Keep the oldest
    const remove = sorted.slice(1); // Mark others as inactive

    console.log(`\nDuplicate Group: ${group.normalizedUrl}`);
    console.log(`  Keeping: ${keep.businessName} (${keep.ownerEmail})`);

    for (const business of remove) {
      console.log(
        `  Removing: ${business.businessName} (${business.ownerEmail})`,
      );

      if (!dryRun) {
        await prisma.business.update({
          where: { id: business.id },
          data: {
            isActive: false,
            deletedAt: new Date(),
            deletedBy: "system",
          },
        });
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const dryRun = process.argv.includes("--dry-run");
  resolveDuplicates(dryRun)
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { detectDuplicates, resolveDuplicates };
