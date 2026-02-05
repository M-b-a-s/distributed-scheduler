import { createClient } from 'redis';
import { Job } from '../models/job.js';

const client = createClient({ url: 'redis://localhost:6379' });
client.connect();

// Safe JSON parse with fallback
function safeJsonParse(str, fallback = null) {
  if (str === undefined || str === null || str === '') {
    return fallback;
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn(`[PersistentStore] Failed to parse JSON: ${str}`);
    return fallback;
  }
}

export class PersistentStore {
  async addJob(job) {
    const jobKey = `job:${job.id}`;
    const json = job.toJSON();
    
    // Build the job data object
    const jobData = {
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
    
    // Use HMSET to store all fields at once (more reliable than hSet with spread)
    const pipeline = client.multi();
    
    // Add all fields using hSet one by one in the pipeline
    for (const [field, value] of Object.entries(jobData)) {
      pipeline.hSet(jobKey, field, value);
    }
    
    // Add to sorted set for scheduled jobs
    pipeline.zAdd('scheduled_jobs', { score: json.schedule, value: job.id });
    
    await pipeline.exec();
    
    console.log(`[PersistentStore] Saved job ${job.id} with data:`, JSON.stringify(jobData, null, 2));
  }

  async getAllJobs() {
    const jobIds = await client.keys('job:*');
    console.log(`[PersistentStore] Found ${jobIds.length} job keys: ${jobIds}`);
    
    const jobs = [];
    for (const key of jobIds) {
      const data = await client.hGetAll(key);
      console.log(`[PersistentStore] Raw data for ${key}:`, JSON.stringify(data));
      
      // Skip if no data or missing required fields
      if (!data || !data.id || !data.schedule) {
        console.warn(`[PersistentStore] Skipping invalid job: ${key}, data:`, JSON.stringify(data));
        continue;
      }
      
      const job = Job.fromJSON({
        id: data.id,
        schedule: parseInt(data.schedule),
        handlerName: data.handlerName || 'defaultHandler',
        data: safeJsonParse(data.data, {}),
        status: data.status || 'pending',
        createdAt: parseInt(data.createdAt) || Date.now(),
        retryStrategy: safeJsonParse(data.retryStrategy, null),
        recurring: data.recurring === 'true',
        cronExpression: data.cronExpression || null,
        intervalMs: data.intervalMs ? parseInt(data.intervalMs) : null,
        executedAt: data.executedAt ? parseInt(data.executedAt) : null,
        lastError: data.lastError || null,
        retryCount: parseInt(data.retryCount) || 0
      });
      
      console.log(`[PersistentStore] Successfully loaded job: ${job.id}`);
      jobs.push(job);
    }
    return jobs;
  }

  async getDueJobs(now) {
    const dueIds = await client.zRangeByScore('scheduled_jobs', 0, now.getTime());
    const dueJobs = [];
    for (const id of dueIds) {
      const data = await client.hGetAll(`job:${id}`);
      
      // Skip if no data or not pending
      if (!data || data.status !== 'pending') {
        continue;
      }
      
      const job = Job.fromJSON({
        id: data.id,
        schedule: parseInt(data.schedule),
        handlerName: data.handlerName || 'defaultHandler',
        data: safeJsonParse(data.data, {}),
        status: data.status,
        createdAt: parseInt(data.createdAt) || Date.now(),
        retryStrategy: safeJsonParse(data.retryStrategy, null),
        recurring: data.recurring === 'true',
        cronExpression: data.cronExpression || null,
        intervalMs: data.intervalMs ? parseInt(data.intervalMs) : null,
        executedAt: data.executedAt ? parseInt(data.executedAt) : null,
        lastError: data.lastError || null,
        retryCount: parseInt(data.retryCount) || 0
      });
      dueJobs.push(job);
    }
    return dueJobs;
  }

  async updateJobStatus(id, status) {
    await client.hSet(`job:${id}`, 'status', status);
  }

  async updateJobExecution(id, executedAt, lastError = null, retryCount = 0) {
    await client.hSet(`job:${id}`, {
      status: 'completed',
      executedAt: executedAt.toString(),
      lastError: lastError || '',
      retryCount: retryCount.toString()
    });
  }

  async removeJob(id) {
    await client.multi()
      .del(`job:${id}`)
      .zRem('scheduled_jobs', id)
      .exec();
  }
}
