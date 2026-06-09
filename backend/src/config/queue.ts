import { Queue } from 'bullmq';

// Establish connection details matching your Redis daemon port
const redisConnection = {
  host: '127.0.0.1',
  port: 6379,
};

// Create the unified Reminder Queue
export const reminderQueue = new Queue('ReminderQueue', {
  connection: redisConnection,
});

console.log('📢 BullMQ Reminder Queue initialized and linked to Redis.');