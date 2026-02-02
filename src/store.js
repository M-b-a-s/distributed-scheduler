export class JobStore {
  constructor() {
    this.jobs = new Map();
    this.scheduled = new Map();
  }
  
  addJob(job) {
    // Store the job
    this.jobs.set(job.id, job);

    // Get execution time
    const execTime = job.schedule;
  }
  
  getDueJobs(now) {
    // TODO: Implement me  
    console.log('Need to implement getDueJobs');
    return [];
  }
}