// add-test-jobs.js
import { JobStore } from './store.js';
import { Job } from './job.js';
import { handlerRegistry } from './handlerRegistry.js';

const store = new JobStore();
await store.init();

// Handler functions
function handleJob1(data) {
  console.log('Job 1 executing:', data);
}

function handleJob2(data) {
  console.log('Job 2 executing:', data);
}

function handleJob3(data) {
  console.log('Job 3 executing:', data);
}

// Add test jobs with handlerName in options
const job1 = new Job('job1', new Date(Date.now() + 5000), handleJob1, { msg: 'Hello' }, { handlerName: 'handleJob1' });
const job2 = new Job('job2', new Date(Date.now() + 10000), handleJob2, { msg: 'World' }, { handlerName: 'handleJob2' });
const job3 = new Job('job3', new Date(Date.now() + 20000), handleJob3, { msg: 'Delayed task' }, { handlerName: 'handleJob3' });

await store.addJob(job1);
await store.addJob(job2);
await store.addJob(job3);
console.log('Added 3 test jobs - they will execute in 5, 10, and 20 seconds');
console.log('Registered handlers:', Object.keys(handlerRegistry));
process.exit(0);
