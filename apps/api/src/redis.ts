import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn("WARNING: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env variables are missing.");
}

export const redis = new Redis({
  url: url || "",
  token: token || "",
});

// Cache helpers
export async function getCachedLeaderboard(): Promise<any[] | null> {
  try {
    const cached = await redis.get("ecosphere:leaderboard");
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : (cached as any);
    }
  } catch (err) {
    console.error("Redis get cached leaderboard error:", err);
  }
  return null;
}

export async function setCachedLeaderboard(data: any[]): Promise<void> {
  try {
    await redis.set("ecosphere:leaderboard", JSON.stringify(data), { ex: 3600 }); // cache for 1 hour
  } catch (err) {
    console.error("Redis set cached leaderboard error:", err);
  }
}

export async function invalidateLeaderboard(): Promise<void> {
  try {
    await redis.del("ecosphere:leaderboard");
  } catch (err) {
    console.error("Redis invalidate leaderboard error:", err);
  }
}

export async function getCachedStats(key: string): Promise<any | null> {
  try {
    const cached = await redis.get(`ecosphere:stats:${key}`);
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : (cached as any);
    }
  } catch (err) {
    console.error("Redis get cached stats error:", err);
  }
  return null;
}

export async function setCachedStats(key: string, data: any): Promise<void> {
  try {
    await redis.set(`ecosphere:stats:${key}`, JSON.stringify(data), { ex: 3600 }); // cache for 1 hour
  } catch (err) {
    console.error("Redis set cached stats error:", err);
  }
}

export async function invalidateStats(): Promise<void> {
  try {
    // Scan or delete all stats keys
    await redis.del("ecosphere:stats:emissions");
    await prismaInvalidateStatsHook();
  } catch (err) {
    console.error("Redis invalidate stats error:", err);
  }
}

// Helper hook
async function prismaInvalidateStatsHook() {
  // Can be extended if needed
}
