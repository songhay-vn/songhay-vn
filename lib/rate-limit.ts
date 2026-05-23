import { NextRequest } from "next/server";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitState {
  timestamps: number[];
}

const cache = new Map<string, RateLimitState>();

export function getIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}

export function rateLimit(ip: string, config: RateLimitConfig): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const state = cache.get(ip) || { timestamps: [] };

  // Filter out timestamps outside the current window
  state.timestamps = state.timestamps.filter((timestamp) => timestamp > windowStart);

  if (state.timestamps.length >= config.limit) {
    const oldestTimestamp = state.timestamps[0];
    const reset = oldestTimestamp + config.windowMs;
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset,
    };
  }

  state.timestamps.push(now);
  cache.set(ip, state);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - state.timestamps.length,
    reset: now + config.windowMs,
  };
}

export function createRateLimitResponse(reset: number) {
  const secondsToWait = Math.ceil((reset - Date.now()) / 1000);
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": secondsToWait.toString(),
    },
  });
}
