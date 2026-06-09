import { createClient } from 'redis';

// Initialize the Redis client (defaults to localhost:6379)
export const redisClient = createClient();

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// Connect to the in-memory instance on boot
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Hyper-fast Redis Cache connected successfully.');
  }
};
connectRedis();