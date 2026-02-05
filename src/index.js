import { JobStore } from './store.js';
import { Scheduler } from './scheduler.js';
import { defaultRegistry } from './handlerRegistry.js';

async function main() {
  try {
    // Initialize store with HandlerRegistry (functions stay in memory)
    const store = new JobStore(defaultRegistry);
    await store.init(); // Recover jobs from Redis

    const scheduler = new Scheduler(store);
    scheduler.start();
    console.log('Scheduler started with handler registry:', defaultRegistry.keys());

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
