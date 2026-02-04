import { createClient }from 'redis';
import { Job } from './job.js';
import { handlerRegistry } from './handlerRegistry.js';

const client = createClient({ url: 'redis://localhost:6379' });
client.connect();

export class PersistentStore {
  async addJob(job) {
    const jobKey = `job:${job.id}`;
    const json = job.toJSON();
    
    // Flatten all values to strings for Redis
    // IMPORTANT: Redis hash only stores flat key-value pairs
    const hashData = {
      id: json.id,
      schedule: json.schedule.toString(),
      data: JSON.stringify(json.data),        // Object → string
      status: json.status,
      createdAt: json.createdAt.toString(),
      handlerType: json.handlerType,
      handlerName: json.handlerName,
      recurring: json.recurring.toString(),
      cronExpression: json.cronExpression || '',
      intervalMs: json.intervalMs ? json.intervalMs.toString() : '',
      // If you have retryStrategy or other nested objects:
      retryStrategy: JSON.stringify(json.retryStrategy || null)  // Nested object → string
    };
    
    await client.multi()
      .hSet(jobKey, hashData)
      .zAdd('scheduled_jobs', { score: json.schedule, value: job.id })
      .exec();
  }

  async getAllJobs() {
    const jobIds = await client.keys('job:*');
    const jobs = [];
    for (const key of jobIds) {
      const data = await client.hGetAll(key);
      const handlerName = data.handlerName;
      const handler = handlerRegistry[handlerName] || handlerRegistry.defaultHandler;
      
      const job = Job.fromJSON({
        id: data.id,
        schedule: parseInt(data.schedule),
        data: JSON.parse(data.data),
        status: data.status,
        createdAt: parseInt(data.createdAt),
        handlerType: data.handlerType,
        handlerName: data.handlerName,
        recurring: data.recurring === 'true',
        cronExpression: data.cronExpression || null,
        intervalMs: data.intervalMs ? parseInt(data.intervalMs) : null,
        retryStrategy: data.retryStrategy ? JSON.parse(data.retryStrategy) : null
      }, handler);
      
      jobs.push(job);
    }
    return jobs;
  }

  // ... rest of methods unchanged
}
