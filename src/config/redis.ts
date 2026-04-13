import Redis from 'ioredis';
import logger from '../utils/logger';

let isRedisConnected = false;
let lastLogTime = 0;
const LOG_COOLDOWN = 30000; // Log error every 30 seconds to prevent spam

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true, // Don't connect immediately
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

if (process.env.CACHE_STORE === 'redis') {
  redis.connect().catch((err) => {
    logger.error(`Initial Redis connection failed: ${err.message}`);
  });
}

redis.on('connect', () => {
  isRedisConnected = true;
  lastLogTime = 0; // Reset
  logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  isRedisConnected = false;
  
  const now = Date.now();
  if (now - lastLogTime > LOG_COOLDOWN) {
    logger.error(`Redis connection issue: ${err.message} (Will retry...)`);
    lastLogTime = now;
  } else {
    // Only log at debug level during cooldown
    logger.debug(`Redis connection retry: ${err.message}`);
  }
});

export { isRedisConnected };
export default redis;
