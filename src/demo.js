import { JobStore } from './store.js';
import { Scheduler } from './scheduler.js';

// Create store and scheduler
const store = new JobStore();
const scheduler = new Scheduler(store);

// Start the scheduler
scheduler.start();

console.log('=== DISTRIBUTED SCHEDULER DEMO ===\n');

// Schedule some jobs
scheduler.scheduleJob(
  (data) => console.log(`Job 1: ${data.message}`),
  2000,  // Run in 2 seconds
  { message: 'Hello from delayed job!' }
);

scheduler.scheduleJob(
  (data) => {
    console.log(`Job 2: Counting to ${data.count}`);
    for (let i = 1; i <= data.count; i++) {
      console.log(`  ${i}...`);
    }
  },
  3500,  // Run in 3.5 seconds
  { count: 3 }
);

scheduler.scheduleJob(
  (data) => {
    console.log(`Job 3: This will fail`);
    throw new Error('Intentional failure for testing');
  },
  5000,  // Run in 5 seconds
  {}
);

console.log('\n3 jobs scheduled. Waiting for execution...\n');

// Stop scheduler after 10 seconds
setTimeout(() => {
  scheduler.stop();
  console.log('\nDemo complete. Scheduler stopped.');
  process.exit(0);
}, 10000);