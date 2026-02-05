import { Job } from '../models/job.js';

export class Scheduler {
  constructor(store) {
    this.store = store;
    this.isRunning = false;
    this.tickInterval = 1000; // Check every second
    this.intervalId = null;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Scheduler started');
    
    // Start the tick loop
    this.tick();
    
    // Schedule next tick
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Scheduler stopped');
  }
  
  tick() {
    if (!this.isRunning) return;
    
    const now = Date.now();
    
    // 1. Get all due jobs
    const dueJobs = this.store.getDueJobs(now);
    
    // 2. Execute each job
    dueJobs.forEach(job => {
      this.executeJob(job);
    });
  }
  
  async executeJob(job) {
    try {
      // Update status to running
      this.store.updateJobStatus(job.id, 'running');
      console.log(`[${new Date().toISOString()}] Executing job ${job.id} (handler: ${job.handlerName})`);
      
      // Get handler function from registry at runtime
      const handler = this.store.getHandlerForJob(job);
      
      // Execute the handler
      await handler(job.data);
      
      // Update execution status
      const executedAt = Date.now();
      await this.store.updateJobExecution(job.id, executedAt, null, job.retryCount);
      console.log(`[${new Date().toISOString()}] Job ${job.id} completed`);
      
      // Remove completed job
      await this.store.removeJob(job.id);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Job ${job.id} failed:`, error);
      job.lastError = error.message;
      job.retryCount++;
      
      // Update failure status
      const executedAt = Date.now();
      await this.store.updateJobExecution(job.id, executedAt, error.message, job.retryCount);
      this.store.updateJobStatus(job.id, 'failed');
    }
  }
  
  scheduleJob(handlerName, delayMs, data = {}) {
    // Generate unique ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate schedule time
    const scheduleTime = Date.now() + delayMs;
    
    // Create job with handler NAME (string), not function
    const job = new Job(jobId, scheduleTime, handlerName, data);
    
    // Add to store
    this.store.addJob(job);
    
    console.log(`Scheduled job ${jobId} (handler: ${handlerName}) to run at ${new Date(scheduleTime).toISOString()}`);
    
    return jobId;
  }
}
