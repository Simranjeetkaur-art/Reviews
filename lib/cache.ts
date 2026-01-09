// Redis cache implementation for feedback caching
// This is a placeholder - will work with or without Redis

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem> = new Map();

  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

// Use in-memory cache as fallback if Redis is not configured
export const cache = new MemoryCache();

// Helper function to get cached feedbacks
export async function getCachedFeedbacks(businessId: string) {
  const cacheKey = `feedbacks:${businessId}`;
  return await cache.get(cacheKey);
}

// Helper function to set cached feedbacks
export async function setCachedFeedbacks(
  businessId: string,
  feedbacks: any[],
  ttl: number = 3600,
) {
  const cacheKey = `feedbacks:${businessId}`;
  await cache.set(cacheKey, feedbacks, ttl);
}

// Helper function to invalidate cache
export async function invalidateFeedbackCache(businessId: string) {
  const cacheKey = `feedbacks:${businessId}`;
  await cache.del(cacheKey);
}
