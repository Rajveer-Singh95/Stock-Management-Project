const { getRedisClient } = require('../config/redis');

const DEFAULT_TTL = 300; // 5 minutes

async function cacheGet(key) {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, data, ttl = DEFAULT_TTL) {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.setex(key, ttl, JSON.stringify(data));
  } catch {
    // ignore
  }
}

async function cacheDel(key) {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // ignore
  }
}

async function cacheDelPattern(pattern) {
  const client = getRedisClient();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // ignore
  }
}

module.exports = { cacheGet, cacheSet, cacheDel, cacheDelPattern };
