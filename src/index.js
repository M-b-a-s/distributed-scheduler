import { JobStore } from './store.js';
import { Scheduler } from './scheduler.js';

async function main() {
  try {
    const store = new JobStore();
    await store.init(); // Recover jobs from Redis

    const scheduler = new Scheduler(store);
    scheduler.start();

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('Shutting down scheduler...');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('Shutting down scheduler...');
      scheduler.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start scheduler:', error);
    process.exit(1);
  }
}

main();