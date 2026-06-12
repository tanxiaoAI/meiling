/**
 * 简单的内存速率限制器。
 * 仅适用于单进程部署；多进程部署需替换为 Redis 方案。
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
  lastCleanup = now;
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  cleanupExpired();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  entry.count += 1;
  const remaining = maxAttempts - entry.count;

  if (remaining < 0) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining };
}
