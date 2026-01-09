import { prisma } from "@/lib/prisma";
import { normalizeGoogleMapsUrl } from "@/lib/url-normalizer";

/**
 * Script to normalize existing Google Maps URLs in the database
 * Run this after adding the normalizedGoogleMapsUrl field to the schema
 */
async function normalizeExistingUrls() {
  try {
    console.log("Starting URL normalization...");

    const businesses = await prisma.business.findMany({
      where: {
        normalizedGoogleMapsUrl: null,
      },
    });

    console.log(`Found ${businesses.length} businesses to normalize`);

    let updated = 0;
    let errors = 0;

    for (const business of businesses) {
      try {
        // Skip businesses without a googleMapsUrl
        if (!business.googleMapsUrl) {
          continue;
        }
        const normalized = normalizeGoogleMapsUrl(business.googleMapsUrl);
        await prisma.business.update({
          where: { id: business.id },
          data: { normalizedGoogleMapsUrl: normalized },
        });
        updated++;
        if (updated % 10 === 0) {
          console.log(`Normalized ${updated} businesses...`);
        }
      } catch (error) {
        console.error(`Error normalizing business ${business.id}:`, error);
        errors++;
      }
    }

    console.log(`\nNormalization complete!`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Errors: ${errors}`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  normalizeExistingUrls()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { normalizeExistingUrls };
