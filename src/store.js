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

    // Add to scheduled jobs
    if(!this.scheduled.has(execTime)) {
        this.scheduled.set(execTime, [])
    }
    this.scheduled.get(execTime).push(job.id);

    return job.id;
  }
  
  getDueJobs(now) {
    const dueJobs = [];
    
    // Find all scheduled times <= now
    for (const [execTime, jobIds] of this.scheduled.entries()) {
      if (execTime <= now) {
        // Get the actual Job objects
        for (const jobId of jobIds) {
          const job = this.jobs.get(jobId);
          if (job && job.status === 'pending') {
            dueJobs.push(job);
          }
        }
        // Remove this time entry since we've processed it
        this.scheduled.delete(execTime);
      }
    }
    return dueJobs;
  }

  updateJobStatus(jobId, status) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
    }
  }
  
  removeJob(jobId) {
    this.jobs.delete(jobId);
  }
}