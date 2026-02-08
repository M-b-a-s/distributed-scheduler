import { Job } from '../models/job.js';

// Helper for consistent timestamp format
function timestamp() {
  return new Date().toISOString();
}

// Helper to format log output
function logJobEvent(event, job, details = '') {
  const emoji = event === 'TRIGGERED' ? '🔔' : 
                event === 'STARTED' ? '▶️' : 
                event === 'COMPLETED' ? '✅' : 
                event === 'FAILED' ? '❌' : '📋';
  console.log(`${emoji} [${timestamp()}] [${event}] Job: ${job.id} | Handler: ${job.handlerName} ${details}`);
}

export class Scheduler {
  constructor(store) {
    this.store = store;
    this.isRunning = false;
    this.tickInterval = 1000; // Check every second
    this.intervalId = null;
    this.jobsExecuting = new Set(); // Track currently executing jobs
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 DISTRIBUTED SCHEDULER STARTED');
    console.log('📅 Monitoring for scheduled jobs every 1 second...');
    console.log('═══════════════════════════════════════════════════════════\n');
    
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
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🛑 Scheduler stopped');
    console.log('═══════════════════════════════════════════════════════════\n');
  }
  
  async tick() {
    if (!this.isRunning) return;
    
    const now = Date.now();
    
    // 1. Get all due jobs
    const dueJobs = this.store.getDueJobs(now);
    
    // 2. Execute each job (await each to ensure completion)
    for (const job of dueJobs) {
      await this.executeJob(job);
    }
  }
  
  async executeJob(job) {
    const startTime = Date.now();
    
    // Prevent duplicate execution of same job
    if (this.jobsExecuting.has(job.id)) {
      console.log(`⚠️ [${timestamp()}] [SKIPPED] Job ${job.id} is already executing, skipping duplicate`);
      return;
    }
    
    this.jobsExecuting.add(job.id);
    
    try {
      // Update status to running
      await this.store.updateJobStatus(job.id, 'running');
      logJobEvent('STARTED', job, `| Data: ${JSON.stringify(job.data)}`);
      
      // Get handler function from registry
      const handler = this.store.getHandlerForJob(job);
      
      // Execute the handler and capture result
      console.log(`⏳ [${timestamp()}] [EXECUTING] Job ${job.id} - handler "${job.handlerName}" running...`);
      
      const result = await handler(job.data);
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Update execution status - success
      const executedAt = Date.now();
      await this.store.updateJobExecution(job.id, executedAt, null, job.retryCount);
      
      // Log completion with result
      const resultPreview = result !== undefined ? 
        ` | Result: ${typeof result === 'object' ? JSON.stringify(result).substring(0, 100) : result}` : 
        '';
      
      logJobEvent('COMPLETED', job, `| Duration: ${executionTime}ms${resultPreview}`);
      
      // Remove completed job
      await this.store.removeJob(job.id);
      
      // Log job removal
      console.log(`🗑️  [${timestamp()}] [REMOVED] Job ${job.id} removed from queue`);
      
    } catch (error) {
      // Calculate execution time before error
      const executionTime = Date.now() - startTime;
      
      // Log failure with error details
      console.log('\n' + '═'.repeat(70));
      logJobEvent('FAILED', job, `| Duration: ${executionTime}ms`);
      console.log(`💥 [${timestamp()}] [ERROR] ${error.name}: ${error.message}`);
      if (error.stack) {
        console.log(`📍 [${timestamp()}] [STACK] ${error.stack.split('\n').slice(1, 3).join('\n')}`);
      }
      console.log('═'.repeat(70) + '\n');
      
      job.lastError = error.message;
      job.retryCount++;
      
      // Update failure status
      const executedAt = Date.now();
      await this.store.updateJobExecution(job.id, executedAt, error.message, job.retryCount);
      await this.store.updateJobStatus(job.id, 'failed');
      
      // Don't remove failed jobs - they can be retried manually or via retry strategy
      console.log(`📋 [${timestamp()}] [RETAINED] Job ${job.id} retained for retry (attempt ${job.retryCount})`);
      
    } finally {
      this.jobsExecuting.delete(job.id);
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
    
    // Log scheduling
    const timeUntilExecute = delayMs >= 60000 ? 
      `${(delayMs / 60000).toFixed(1)} min` : 
      `${(delayMs / 1000).toFixed(1)} sec`;
    
    console.log('\n' + '─'.repeat(70));
    logJobEvent('SCHEDULED', job, `| Execute in: ${timeUntilExecute} | Data: ${JSON.stringify(data).substring(0, 50)}`);
    console.log('─'.repeat(70));
    
    return jobId;
  }
}
