export class Job {
  constructor(id, schedule, handler, data = {}) {
    if (!id) throw new Error('Missing required parameter: id');
    if (!schedule) throw new Error('Missing required parameter: schedule');
    if (!handler || typeof handler !== 'function') throw new Error('Missing or invalid required parameter: handler (must be a function)');
    
    this.id = id;
    this.schedule = schedule;  // timestamp for now
    this.handler = handler;    // function to execute
    this.data = data;
    this.status = 'pending';   // pending, running, completed, failed
    this.createdAt = Date.now();
  }
}