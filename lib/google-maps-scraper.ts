// Utility to scrape Google Maps About page content

export interface GoogleMapsAboutContent {
  about?: string;
  accessibility?: string[];
  serviceOptions?: string[];
  highlights?: string[];
  amenities?: string[];
  other?: string;
}

/**
 * Scrapes Google Maps About page to extract business information
 * Note: This is a simplified version. In production, you might want to use
 * a proper scraping service or Google Places API.
 */
export async function scrapeGoogleMapsAbout(
  url: string,
): Promise<GoogleMapsAboutContent | null> {
  try {
    // Validate URL
    if (!url || !url.includes("google.com/maps")) {
      return null;
    }

    // For now, we'll use a fetch approach with proper headers
    // Note: Google Maps may block direct scraping, so you might need to use:
    // 1. Google Places API (recommended)
    // 2. A headless browser service (Puppeteer, Playwright)
    // 3. A third-party scraping service

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Google Maps page:", response.status);
      return null;
    }

    const html = await response.text();

    // Extract content using regex patterns (simplified approach)
    // In production, use a proper HTML parser like cheerio or jsdom
    const content: GoogleMapsAboutContent = {
      about: extractAbout(html),
      accessibility: extractAccessibility(html),
      serviceOptions: extractServiceOptions(html),
      highlights: extractHighlights(html),
      amenities: extractAmenities(html),
    };

    // Return null if no content was extracted
    if (
      !content.about &&
      !content.accessibility?.length &&
      !content.serviceOptions?.length &&
      !content.highlights?.length &&
      !content.amenities?.length
    ) {
      return null;
    }

    return content;
  } catch (error) {
    console.error("Error scraping Google Maps About page:", error);
    return null;
  }
}

function extractAbout(html: string): string | undefined {
  // Try to find "About" section
  const aboutMatch = html.match(
    /<div[^>]*class="[^"]*about[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (aboutMatch) {
    return cleanText(aboutMatch[1]);
  }

  // Try alternative patterns
  const descriptionMatch = html.match(
    /<div[^>]*data-value="([^"]*)"[^>]*data-section-id="description"/i,
  );
  if (descriptionMatch) {
    return cleanText(descriptionMatch[1]);
  }

  return undefined;
}

function extractAccessibility(html: string): string[] {
  const accessibility: string[] = [];

  // Look for accessibility-related content
  const accessibilityPatterns = [
    /wheelchair[^<]*accessible/gi,
    /accessible[^<]*entrance/gi,
    /accessible[^<]*parking/gi,
    /accessible[^<]*restroom/gi,
  ];

  accessibilityPatterns.forEach((pattern) => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        const cleaned = cleanText(match);
        if (cleaned && !accessibility.includes(cleaned)) {
          accessibility.push(cleaned);
        }
      });
    }
  });

  return accessibility;
}

function extractServiceOptions(html: string): string[] {
  const serviceOptions: string[] = [];

  // Look for service options like "Dine-in", "Takeout", "Delivery", etc.
  const servicePatterns = [
    /dine[-\s]?in/gi,
    /takeout/gi,
    /delivery/gi,
    /drive[-\s]?through/gi,
    /curbside[-\s]?pickup/gi,
    /outdoor[-\s]?seating/gi,
    /indoor[-\s]?seating/gi,
  ];

  servicePatterns.forEach((pattern) => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        const cleaned = cleanText(match);
        if (cleaned && !serviceOptions.includes(cleaned)) {
          serviceOptions.push(cleaned);
        }
      });
    }
  });

  return serviceOptions;
}

function extractHighlights(html: string): string[] {
  const highlights: string[] = [];

  // Look for highlights or featured attributes
  const highlightPatterns = [
    /<span[^>]*class="[^"]*highlight[^"]*"[^>]*>([^<]+)<\/span>/gi,
    /<div[^>]*class="[^"]*feature[^"]*"[^>]*>([^<]+)<\/div>/gi,
  ];

  highlightPatterns.forEach((pattern) => {
    const matches = [...html.matchAll(pattern)];
    matches.forEach((match) => {
      const cleaned = cleanText(match[1]);
      if (cleaned && !highlights.includes(cleaned)) {
        highlights.push(cleaned);
      }
    });
  });

  return highlights;
}

function extractAmenities(html: string): string[] {
  const amenities: string[] = [];

  // Look for amenities
  const amenityPatterns = [
    /wifi/gi,
    /parking/gi,
    /restroom/gi,
    /outdoor[-\s]?seating/gi,
    /live[-\s]?music/gi,
    /pet[-\s]?friendly/gi,
  ];

  amenityPatterns.forEach((pattern) => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        const cleaned = cleanText(match);
        if (cleaned && !amenities.includes(cleaned)) {
          amenities.push(cleaned);
        }
      });
    }
  });

  return amenities;
}

function cleanText(text: string): string {
  if (!text) return "";

  return text
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
