/**
 * URL Normalization Utility for Google Maps URLs
 *
 * Normalizes Google Maps URLs to a consistent format for duplicate detection.
 * Handles variations in protocol, case, trailing slashes, and query parameters.
 */

/**
 * Normalizes a Google Maps URL to a consistent format for comparison
 * @param url - The URL to normalize
 * @returns Normalized URL string
 */
export function normalizeGoogleMapsUrl(url: string): string {
  if (!url) return "";

  let normalized = url.trim();

  // Convert to lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase();

  // Remove protocol (http://, https://)
  normalized = normalized.replace(/^https?:\/\//i, "");

  // Remove www. prefix
  normalized = normalized.replace(/^www\./i, "");

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "");

  // Remove query parameters (Google Maps URLs are unique by path, not query params)
  // e.g., https://g.page/r/example?param=value and https://g.page/r/example are the same
  normalized = normalized.split("?")[0];

  // Remove fragment (#)
  normalized = normalized.split("#")[0];

  // Trim again after all operations
  normalized = normalized.trim();

  return normalized;
}

/**
 * Validates if a URL is a valid Google Maps URL format
 * @param url - The URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  if (!url || url.trim() === "") return false;

  const normalized = normalizeGoogleMapsUrl(url);

  // Check if it's a valid Google Maps URL pattern
  const googleMapsPatterns = [
    /^g\.page\/r\//, // g.page/r/... (most common for review links)
    /^maps\.google\.com/, // maps.google.com
    /^www\.google\.com\/maps/, // www.google.com/maps
    /^google\.com\/maps/, // google.com/maps
    /^goo\.gl\/maps/, // goo.gl/maps (shortened)
  ];

  return googleMapsPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Validates and normalizes a Google Maps URL
 * @param url - The URL to validate and normalize
 * @returns Object with validation result and normalized URL
 */
export function validateAndNormalizeGoogleMapsUrl(url: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!url || url.trim() === "") {
    return {
      valid: false,
      error: "Google Maps Review URL is required",
    };
  }

  if (!isValidGoogleMapsUrl(url)) {
    return {
      valid: false,
      error:
        "Please enter a valid Google Maps Review URL (e.g., https://g.page/r/... or https://maps.google.com/...)",
    };
  }

  const normalized = normalizeGoogleMapsUrl(url);

  return {
    valid: true,
    normalized,
  };
}
