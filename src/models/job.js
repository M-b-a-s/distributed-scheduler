export class Job {
  constructor(id, schedule, handlerName, data = {}, options = {}) {
    this.id = id;
    this.schedule = schedule;
    this.handlerName = handlerName;  // Only store handler NAME (string), not function
    this.data = data;
    this.status = 'pending';
    this.createdAt = Date.now();
    
    // Options for persistence
    this.retryStrategy = options.retryStrategy || null;
    
    // For recurring jobs (future)
    this.recurring = options.recurring || false;
    this.cronExpression = options.cronExpression || null;
    this.intervalMs = options.intervalMs || null;
    
    // Execution history
    this.executedAt = null;
    this.lastError = null;
    this.retryCount = 0;
  }
  
  // ============================================
  // Recurring Job Helper Methods
  // ============================================
  
  /**
   * Check if this job is configured as a recurring job
   * @returns {boolean}
   */
  isRecurring() {
    return this.recurring === true && !!this.cronExpression;
  }
  
  /**
   * Check if this job should be rescheduled after execution
   * @returns {boolean}
   */
  shouldReschedule() {
    return this.isRecurring();
  }
  
  /**
   * Reset job state for the next execution cycle
   */
  resetForNextRun() {
    this.status = 'pending';
    this.executedAt = null;
    this.lastError = null;
    this.retryCount = 0;
  }
  
  /**
   * Get a human-readable description of the schedule
   * @returns {string}
   */
  getScheduleDescription() {
    if (this.isRecurring()) {
      return `Recurring: ${this.cronExpression}`;
    } else if (this.schedule instanceof Date) {
      return `One-time: ${this.schedule.toISOString()}`;
    }
    return `Schedule: ${this.schedule}`;
  }
  
  // Convert to serializable object (pure data, no functions)
  toJSON() {
    return {
      id: this.id,
      schedule: this.schedule instanceof Date ? this.schedule.getTime() : this.schedule,
      handlerName: this.handlerName,
      data: this.data,
      status: this.status,
      createdAt: this.createdAt,
      retryStrategy: this.retryStrategy,
      recurring: this.recurring,
      cronExpression: this.cronExpression,
      intervalMs: this.intervalMs,
      executedAt: this.executedAt,
      lastError: this.lastError,
      retryCount: this.retryCount
    };
  }
  
  // Static method to recreate from JSON (pure data)
  static fromJSON(json) {
    const job = new Job(
      json.id,
      new Date(json.schedule),
      json.handlerName,
      json.data,
      {
        retryStrategy: json.retryStrategy,
        recurring: json.recurring,
        cronExpression: json.cronExpression,
        intervalMs: json.intervalMs
      }
    );
    
    job.status = json.status;
    job.createdAt = json.createdAt;
    job.executedAt = json.executedAt;
    job.lastError = json.lastError;
    job.retryCount = json.retryCount || 0;
    
    return job;
  }
}
