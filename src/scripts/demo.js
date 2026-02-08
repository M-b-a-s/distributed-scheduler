import { JobStore } from '../store/jobStore.js';
import { Scheduler } from '../scheduler/scheduler.js';
import { defaultRegistry } from '../registry/handlerRegistry.js';

console.log('=== DISTRIBUTED SCHEDULER DEMO ===\n');

// Create store and scheduler with handler registry
const store = new JobStore(defaultRegistry);
const scheduler = new Scheduler(store);

// Initialize store (loads jobs from Redis)
await store.init();

// Start the scheduler
scheduler.start();

console.log('\n--- Scheduling 3 demo jobs ---\n');

// Schedule some jobs using handler NAMES (not functions)
// Jobs will execute after their delays
scheduler.scheduleJob('consoleHandler', 3000, { message: 'Job 1: First job executing after 3 seconds!' });
scheduler.scheduleJob('consoleHandler', 6000, { message: 'Job 2: Second job executing after 6 seconds!' });
scheduler.scheduleJob('consoleHandler', 9000, { message: 'Job 3: Third job executing after 9 seconds!' });

console.log('\n--- Demo jobs scheduled successfully ---');
console.log('Jobs will execute at:');
console.log('  - Job 1: ~3 seconds');
console.log('  - Job 2: ~6 seconds');
console.log('  - Job 3: ~9 seconds');
console.log('\nWatch for execution messages below...\n');

// Stop scheduler after 15 seconds
setTimeout(() => {
  console.log('\n--- Demo complete ---');
  scheduler.stop();
  console.log('Scheduler stopped.');
  process.exit(0);
}, 15000);
