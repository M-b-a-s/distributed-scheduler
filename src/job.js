export class Job {
  constructor(id, schedule, handler, data = {}, options = {}) {
    this.id = id;
    this.schedule = schedule;
    this.handler = handler;
    this.data = data;
    this.status = 'pending';
    this.createdAt = Date.now();
    
    // For persistence
    this.handlerType = options.handlerType || 'function';
    this.handlerName = options.handlerName || 'anonymous';
    
    // For retry strategy (nested object)
    this.retryStrategy = options.retryStrategy || null;
    
    // For recurring jobs (future)
    this.recurring = options.recurring || false;
    this.cronExpression = options.cronExpression || null;
    this.intervalMs = options.intervalMs || null;
  }
  
  // Convert to serializable object (without function)
  toJSON() {
    return {
      id: this.id,
      schedule: this.schedule instanceof Date ? this.schedule.getTime() : this.schedule,
      data: this.data,
      status: this.status,
      createdAt: this.createdAt,
      handlerType: this.handlerType,
      handlerName: this.handlerName,
      retryStrategy: this.retryStrategy,
      recurring: this.recurring,
      cronExpression: this.cronExpression,
      intervalMs: this.intervalMs
    };
  }
  
  // Static method to recreate from JSON
  static fromJSON(json, handler = null) {
    const job = new Job(
      json.id,
      new Date(json.schedule),
      handler,
      json.data,
      {
        handlerType: json.handlerType,
        handlerName: json.handlerName,
        retryStrategy: json.retryStrategy,
        recurring: json.recurring,
        cronExpression: json.cronExpression,
        intervalMs: json.intervalMs
      }
    );
    
    job.status = json.status;
    job.createdAt = json.createdAt;
    
    return job;
  }
}
