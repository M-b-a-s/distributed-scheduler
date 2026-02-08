import { PersistentStore } from '../persistence/persistentStore.js';

// Helper to format timestamp for display
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

export class JobStore {
  constructor(handlerRegistry) {
    this.jobs = new Map();
    this.scheduled = new Map();
    this.handlerRegistry = handlerRegistry;  // Reference to handler registry
    this.persistentStore = new PersistentStore();
  }

  async init() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                   JOB STORE INITIALIZING                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('📖 Loading jobs from Redis...');
    const loadedJobs = await this.persistentStore.getAllJobs();
    
    for (const job of loadedJobs) {
      this.jobs.set(job.id, job);
      
      // Ensure schedule is a Date object
      if (!(job.schedule instanceof Date)) {
        job.schedule = new Date(job.schedule);
      }
      
      const execTime = job.schedule.getTime();
      if (!this.scheduled.has(execTime)) {
        this.scheduled.set(execTime, []);
      }
      this.scheduled.get(execTime).push(job.id);
    }
    
    // Log scheduled jobs summary
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│                   SCHEDULED JOBS                            │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    
    if (loadedJobs.length === 0) {
      console.log('│  No jobs scheduled                                          │');
    } else {
      const now = Date.now();
      for (const [execTime, jobIds] of this.scheduled.entries()) {
        const readableTime = formatTime(execTime);
        const isPast = execTime <= now;
        const status = isPast ? '🔴 DUE NOW' : '🟡 PENDING';
        const timeUntil = execTime > now ? ` (in ${Math.ceil((execTime - now) / 1000)}s)` : '';
        console.log(`│  ${status} ${readableTime}${timeUntil.padEnd(20)} │ ${jobIds.join(', ')}`);
      }
    }
    
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
    if (loadedJobs.length > 0) {
      const nextRun = this.scheduled.keys().next().value;
      if (nextRun) {
        const msUntil = nextRun - Date.now();
        if (msUntil > 0) {
          console.log(`⏱️  Next job scheduled in: ${(msUntil / 1000).toFixed(1)} seconds\n`);
        } else {
          console.log(`⚡ Jobs are due for execution!\n`);
        }
      }
    }
    
    console.log('✅ Job Store initialized successfully\n');
  }
  
  async addJob(job) {
    // Ensure schedule is a Date object
    if (!(job.schedule instanceof Date)) {
      job.schedule = new Date(job.schedule);
    }
    
    const existingJob = this.jobs.get(job.id);
    if (existingJob) {
      // Clean old scheduled entry
      const oldExecTime = existingJob.schedule.getTime();
      if (this.scheduled.has(oldExecTime)) {
        const jobIds = this.scheduled.get(oldExecTime);
        const index = jobIds.indexOf(job.id);
        if (index !== -1) {
          jobIds.splice(index, 1);
          if (jobIds.length === 0) {
            this.scheduled.delete(oldExecTime);
          }
        }
      }
    }
    
    // Store the job
    this.jobs.set(job.id, job);

    // Get execution time
    const execTime = job.schedule.getTime();

    // Add to scheduled jobs
    if(!this.scheduled.has(execTime)) {
        this.scheduled.set(execTime, []);
    }
    this.scheduled.get(execTime).push(job.id);

    // Mirror to Redis (only serializable data, no functions)
    await this.persistentStore.addJob(job);

    return job.id;
  }
  
  getDueJobs(now) {
    const dueJobs = [];
    
    // now is already a number from Date.now(), not a Date object
    const nowTime = typeof now === 'number' ? now : now.getTime();
    
    // Find all scheduled times <= now
    for (const [execTime, jobIds] of this.scheduled.entries()) {
      if (execTime <= nowTime) {
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

  async updateJobStatus(jobId, status) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      // Mirror to Redis
      await this.persistentStore.updateJobStatus(jobId, status);
    }
  }
  
  async updateJobExecution(jobId, executedAt, lastError = null, retryCount = 0) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.executedAt = executedAt;
      job.lastError = lastError;
      job.retryCount = retryCount;
      // Mirror to Redis
      await this.persistentStore.updateJobExecution(jobId, executedAt, lastError, retryCount);
    }
  }
  
  async removeJob(jobId) {
    this.jobs.delete(jobId);
    
    // Clean up scheduled entries
    for (const [execTime, jobIds] of this.scheduled.entries()) {
      const index = jobIds.indexOf(jobId);
      if (index !== -1) {
        jobIds.splice(index, 1);
        if (jobIds.length === 0) {
          this.scheduled.delete(execTime);
        }
        break;
      }
    }
    
    // Mirror to Redis
    await this.persistentStore.removeJob(jobId);
  }
  
  // Get handler function from registry for a job
  getHandlerForJob(job) {
    const handler = this.handlerRegistry.get(job.handlerName);
    if (!handler) {
      throw new Error(`Handler "${job.handlerName}" not found for job ${job.id}`);
    }
    return handler;
  }
  
  // Get all jobs (for debugging)
  getAllJobs() {
    return Array.from(this.jobs.values());
  }
  
  // Get pending jobs count
  getPendingCount() {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'pending') {
        count++;
      }
    }
    return count;
  }
}
