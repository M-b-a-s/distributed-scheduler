// add-test-jobs.js
import { JobStore } from '../store/jobStore.js';
import { Job } from '../models/job.js';
import { defaultRegistry } from '../registry/handlerRegistry.js';

const store = new JobStore(defaultRegistry);
await store.init();

// Add test jobs with handler NAME (string), not function
// The actual handler functions are in the HandlerRegistry
const job1 = new Job('job1', new Date(Date.now() + 5000), 'consoleHandler', { msg: 'Hello from job 1' });
const job2 = new Job('job2', new Date(Date.now() + 10000), 'emailHandler', { msg: 'Hello from job 2' });
const job3 = new Job('job3', new Date(Date.now() + 20000), 'defaultHandler', { msg: 'Hello from job 3' });

await store.addJob(job1);
await store.addJob(job2);
await store.addJob(job3);
console.log('Added 3 test jobs - they will execute in 5, 10, and 20 seconds');
console.log('Available handlers:', defaultRegistry.keys());
// console.log(job1);

process.exit(0);
