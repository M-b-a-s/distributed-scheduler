import { JobStore } from '../store/jobStore.js';
import { Scheduler } from '../scheduler/scheduler.js';
import { defaultRegistry } from '../registry/handlerRegistry.js';

// Create store and scheduler with handler registry
const store = new JobStore(defaultRegistry);
const scheduler = new Scheduler(store);

// Start the scheduler
scheduler.start();

console.log('=== DISTRIBUTED SCHEDULER DEMO ===\n');

// Schedule some jobs using handler NAMES (not functions)
scheduler.scheduleJob('consoleHandler', 2000, { message: 'Job 1: Hello from delayed job!' });
scheduler.scheduleJob('consoleHandler', 3500, { count: 3, message: 'Job 2: Counting...' });
scheduler.scheduleJob('consoleHandler', 5000, { message: 'Job 3: This will fail' });

console.log('\n3 jobs scheduled. Waiting for execution...\n');

// Stop scheduler after 10 seconds
setTimeout(() => {
  scheduler.stop();
  console.log('\nDemo complete. Scheduler stopped.');
  process.exit(0);
}, 10000);
