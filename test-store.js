import { Job } from './src/job.js';
import { JobStore } from './src/store.js';

const store = new JobStore();

// Create a job to run in 2 seconds
const job1 = new Job(
  'job-1',
  Date.now() + 2000,
  () => console.log('Job 1 executed'),
  { test: 'data' }
);

store.addJob(job1);
console.log('Job added. Store has', store.jobs.size, 'jobs');

// Immediately check due jobs (should be empty)
console.log('Due jobs now:', store.getDueJobs(Date.now()).length);

// Wait 3 seconds and check again
setTimeout(() => {
  console.log('\n3 seconds later...');
  console.log('Due jobs:', store.getDueJobs(Date.now()).length);
  console.log('Store jobs remaining:', store.jobs.size);
}, 3000);