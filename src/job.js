export class Job {
  constructor(id, schedule, handler, data = {}) {
    this.id = id;
    this.schedule = schedule;  // timestamp for now
    this.handler = handler;    // function to execute
    this.data = data;
    this.status = 'pending';   // pending, running, completed, failed
    this.createdAt = Date.now();
  }
}