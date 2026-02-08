import { JobStore } from './store/jobStore.js';
import { Scheduler } from './scheduler/scheduler.js';
import { defaultRegistry } from './registry/handlerRegistry.js';

async function main() {
  console.log('=== DISTRIBUTED SCHEDULER ===');
  console.log('Starting scheduler service...\n');
  
  try {
    // Initialize store with HandlerRegistry (functions stay in memory)
    const store = new JobStore(defaultRegistry);
    await store.init(); // Recover jobs from Redis

    const scheduler = new Scheduler(store);
    scheduler.start();
    console.log('\nScheduler is running and monitoring for jobs...');
    console.log('Registered handlers:', defaultRegistry.keys());

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT (Ctrl+C)');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM');
      scheduler.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start scheduler:', error.message);
    process.exit(1);
  }
}

main();
