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
    console.log('Scheduler started - monitoring for due jobs...');
    
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
  
  async tick() {
    if (!this.isRunning) return;
    
    const now = Date.now();
    
    // 1. Get all due jobs
    const dueJobs = this.store.getDueJobs(now);
    
    if (dueJobs.length > 0) {
      console.log(`[${new Date().toISOString()}] Found ${dueJobs.length} job(s) due for execution`);
    }
    
    // 2. Execute each job (await each to ensure completion)
    for (const job of dueJobs) {
      await this.executeJob(job);
    }
  }
  
  async executeJob(job) {
    try {
      // Update status to running
      await this.store.updateJobStatus(job.id, 'running');
      console.log(`[${new Date().toISOString()}] ✓ Job ${job.id} (handler: ${job.handlerName}) - STATUS: RUNNING`);
      
      // Get handler function from registry at runtime
      const handler = this.store.getHandlerForJob(job);
      
      // Execute the handler
      await handler(job.data);
      
      // Update execution status - success
      const executedAt = Date.now();
      await this.store.updateJobExecution(job.id, executedAt, null, job.retryCount);
      console.log(`[${new Date().toISOString()}] ✓ Job ${job.id} (handler: ${job.handlerName}) - STATUS: COMPLETED`);
      
      // Remove completed job
      await this.store.removeJob(job.id);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ✗ Job ${job.id} (handler: ${job.handlerName}) - STATUS: FAILED`);
      console.error(`  Error: ${error.message}`);
      job.lastError = error.message;
      job.retryCount++;
      
      // Update failure status
      const executedAt = Date.now();
      await this.store.updateJobExecution(job.id, executedAt, error.message, job.retryCount);
      await this.store.updateJobStatus(job.id, 'failed');
      
      // Don't remove failed jobs - they can be retried manually or via retry strategy
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
    
    console.log(`[${new Date().toISOString()}] Job ${jobId} (handler: ${handlerName}) scheduled for ${new Date(scheduleTime).toISOString()}`);
    
    return jobId;
  }
}
