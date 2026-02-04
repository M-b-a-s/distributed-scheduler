import { Job } from './job.js';
import { JobStore } from './store.js';
import { Scheduler } from './scheduler.js';

console.log('Testing basic setup...');

const store = new JobStore();
const scheduler = new Scheduler(store);

// Test 1: Can we create a job?
const testJob = new Job(
  'test-1',
  Date.now() + 3000,  // 3 seconds from now
  () => console.log('Job executed!'),
  { foo: 'bar' }
);

console.log('Job created:', testJob.id, testJob.status);

// Test 2: Can we add to store?
store.addJob(testJob);

// Test 3: Start scheduler
scheduler.start();

console.log('Basic setup complete');