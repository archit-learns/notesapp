import { Worker, Job } from 'bullmq';

const redisConnection = {
  host: '127.0.0.1',
  port: 6379,
};

// Spin up a worker to continuously listen to 'ReminderQueue'
const reminderWorker = new Worker(
  'ReminderQueue',
  async (job: Job) => {
    // This is the code that fires when the alarm goes off!
    console.log(`\n⏰ [ALARM RINGING] Job ID: ${job.id}`);
    console.log(`📝 Reminder for Note ID: ${job.data.noteId}`);
    console.log(`📢 Message: "${job.data.message}"`);
    console.log(`⏱️ Fired at: ${new Date().toLocaleTimeString()}\n`);
    
    // In a real production app, you would place your email-sending or push-notification code here.
  },
  { connection: redisConnection }
);

reminderWorker.on('completed', (job) => console.log(`✅ Alarm Job ${job.id} executed successfully.`));
reminderWorker.on('failed', (job, err) => console.error(`❌ Alarm Job ${job?.id} failed:`, err));

export default reminderWorker;