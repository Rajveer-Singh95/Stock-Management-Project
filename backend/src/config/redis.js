const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();

let redisClient = null;

async function connectRedis() {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set — caching disabled');
    return;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      tls: process.env.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      redisClient = null;
    });

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (err) {
    console.warn('⚠️  Redis connection failed — running without cache:', err.message);
    redisClient = null;
  }
}

function getRedisClient() {
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };
