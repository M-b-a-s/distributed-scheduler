// add-test-jobs.js
import { JobStore } from '../store/jobStore.js';
import { Job } from '../models/job.js';
import { defaultRegistry } from '../registry/handlerRegistry.js';

console.log('=== Adding Test Jobs ===\n');

const store = new JobStore(defaultRegistry);
await store.init();

// Add test jobs with handler NAME (string), not function
// The actual handler functions are in the HandlerRegistry
const now = Date.now();
const job1 = new Job('job1', new Date(now + 5 * 60 * 1000), 'consoleHandler', { msg: 'Hello from job 1!' });
const job2 = new Job('job2', new Date(now + 6 * 60 * 1000), 'emailHandler', { msg: 'Hello from job 2!' });
const job3 = new Job('job3', new Date(now + 7 * 60 * 1000), 'defaultHandler', { msg: 'Hello from job 3!' });

await store.addJob(job1);
await store.addJob(job2);
await store.addJob(job3);

console.log('\n=== Test Jobs Added Successfully ===');
console.log('Available handlers:', defaultRegistry.keys());
console.log('\nJobs scheduled for:');
console.log(`  - job1 (consoleHandler): ${job1.schedule.toLocaleString()}`);
console.log(`  - job2 (emailHandler): ${job2.schedule.toLocaleString()}`);
console.log(`  - job3 (defaultHandler): ${job3.schedule.toLocaleString()}`);
console.log('\nTo run the scheduler and execute these jobs, run: npm start');

process.exit(0);
