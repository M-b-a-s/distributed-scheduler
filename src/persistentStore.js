import { createClient } from 'redis';
import { Job } from './job.js';

const client = createClient({ url: 'redis://localhost:6379' });
client.connect();

// Helper to flatten object to field/value pairs for hSet
function flattenToPairs(obj) {
  const pairs = [];
  for (const [key, value] of Object.entries(obj)) {
    pairs.push(key, value);
  }
  return pairs;
}

export class PersistentStore {
  async addJob(job) {
    const jobKey = `job:${job.id}`;
    const json = job.toJSON();
    
    // Build flat field/value pairs for Redis hash
    const hashData = {
      id: json.id,
      schedule: json.schedule.toString(),
      handlerName: json.handlerName,
      data: JSON.stringify(json.data),
      status: json.status,
      createdAt: json.createdAt.toString(),
      retryStrategy: JSON.stringify(json.retryStrategy || null),
      recurring: json.recurring.toString(),
      cronExpression: json.cronExpression || '',
      intervalMs: json.intervalMs ? json.intervalMs.toString() : '',
      executedAt: json.executedAt ? json.executedAt.toString() : '',
      lastError: json.lastError || '',
      retryCount: (json.retryCount || 0).toString()
    };
    
    // Use hSet with flat field/value pairs
    await client.multi()
      .hSet(jobKey, ...flattenToPairs(hashData))
      .zAdd('scheduled_jobs', { score: json.schedule, value: job.id })
      .exec();
  }

  async getAllJobs() {
    const jobIds = await client.keys('job:*');
    const jobs = [];
    for (const key of jobIds) {
      const data = await client.hGetAll(key);
      
      const job = Job.fromJSON({
        id: data.id,
        schedule: parseInt(data.schedule),
        handlerName: data.handlerName,
        data: JSON.parse(data.data),
        status: data.status,
        createdAt: parseInt(data.createdAt),
        retryStrategy: data.retryStrategy ? JSON.parse(data.retryStrategy) : null,
        recurring: data.recurring === 'true',
        cronExpression: data.cronExpression || null,
        intervalMs: data.intervalMs ? parseInt(data.intervalMs) : null,
        executedAt: data.executedAt ? parseInt(data.executedAt) : null,
        lastError: data.lastError || null,
        retryCount: parseInt(data.retryCount) || 0
      });
      
      jobs.push(job);
    }
    return jobs;
  }

  async getDueJobs(now) {
    const dueIds = await client.zRangeByScore('scheduled_jobs', 0, now.getTime());
    const dueJobs = [];
    for (const id of dueIds) {
      const data = await client.hGetAll(`job:${id}`);
      if (data.status === 'pending') {
        const job = Job.fromJSON({
          id: data.id,
          schedule: parseInt(data.schedule),
          handlerName: data.handlerName,
          data: JSON.parse(data.data),
          status: data.status,
          createdAt: parseInt(data.createdAt),
          retryStrategy: data.retryStrategy ? JSON.parse(data.retryStrategy) : null,
          recurring: data.recurring === 'true',
          cronExpression: data.cronExpression || null,
          intervalMs: data.intervalMs ? parseInt(data.intervalMs) : null,
          executedAt: data.executedAt ? parseInt(data.executedAt) : null,
          lastError: data.lastError || null,
          retryCount: parseInt(data.retryCount) || 0
        });
        dueJobs.push(job);
      }
    }
    return dueJobs;
  }

  async updateJobStatus(id, status) {
    await client.hSet(`job:${id}`, 'status', status);
  }

  async updateJobExecution(id, executedAt, lastError = null, retryCount = 0) {
    const updates = {
      status: 'completed',
      executedAt: executedAt.toString(),
      lastError: lastError || '',
      retryCount: retryCount.toString()
    };
    // Use hSet with flat field/value pairs
    await client.hSet(`job:${id}`, ...flattenToPairs(updates));
  }

  async removeJob(id) {
    await client.multi()
      .del(`job:${id}`)
      .zRem('scheduled_jobs', id)
      .exec();
  }
}
