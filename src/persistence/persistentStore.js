import { createClient } from 'redis';
import { Job } from '../models/job.js';

let client = null;

async function getClient() {
  if (!client) {
    client = createClient({ url: 'redis://localhost:6379' });
    
    client.on('error', (err) => {
      console.error('🔴 [Redis] Client Error:', err.message);
    });
    
    client.on('connect', () => {
      console.log('🟢 [Redis] Connected');
    });
    
    client.on('ready', () => {
      console.log('🟢 [Redis] Ready to accept commands');
    });
    
    client.on('reconnecting', () => {
      console.log('🟡 [Redis] Reconnecting...');
    });
    
    await client.connect();
  }
  return client;
}

// Safe JSON parse with fallback
function safeJsonParse(str, fallback = null) {
  if (str === undefined || str === null || str === '') {
    return fallback;
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

export class PersistentStore {
  constructor() {
    this.initialized = false;
  }
  
  async ensureConnection() {
    try {
      await getClient();
      this.initialized = true;
    } catch (error) {
      console.error('🔴 [PersistentStore] Failed to connect to Redis:', error.message);
      throw error;
    }
  }
  
  async addJob(job) {
    try {
      await this.ensureConnection();
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
      
      // Use pipeline for atomic operations
      const pipeline = client.multi();
      
      for (const [field, value] of Object.entries(jobData)) {
        pipeline.hSet(jobKey, field, value);
      }
      
      // Add to sorted set for scheduled jobs
      pipeline.zAdd('scheduled_jobs', { score: json.schedule, value: job.id });
      
      await pipeline.exec();
      
    } catch (error) {
      console.error(`🔴 [PersistentStore] Failed to save job ${job.id}:`, error.message);
      throw error;
    }
  }

  async getAllJobs() {
    try {
      await this.ensureConnection();
      const jobIds = await client.keys('job:*');
      
      if (jobIds.length === 0) {
        return [];
      }
      
      const jobs = [];
      for (const key of jobIds) {
        const data = await client.hGetAll(key);
        
        // Skip if no data or missing required fields
        if (!data || !data.id || !data.schedule) {
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
        
        jobs.push(job);
      }
      
      return jobs;
    } catch (error) {
      console.error('[PersistentStore] Failed to get all jobs:', error.message);
      return [];
    }
  }

  async getDueJobs(now) {
    try {
      await this.ensureConnection();
      const nowTime = typeof now === 'number' ? now : now.getTime();
      const dueIds = await client.zRangeByScore('scheduled_jobs', 0, nowTime);
      
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
    } catch (error) {
      console.error('[PersistentStore] Failed to get due jobs:', error.message);
      return [];
    }
  }

  async updateJobStatus(id, status) {
    try {
      await this.ensureConnection();
      await client.hSet(`job:${id}`, 'status', status);
    } catch (error) {
      console.error(`[PersistentStore] Failed to update job ${id} status:`, error.message);
    }
  }

  async updateJobExecution(id, executedAt, lastError = null, retryCount = 0) {
    try {
      await this.ensureConnection();
      await client.hSet(`job:${id}`, {
        status: 'completed',
        executedAt: executedAt.toString(),
        lastError: lastError || '',
        retryCount: retryCount.toString()
      });
    } catch (error) {
      console.error(`[PersistentStore] Failed to update job ${id} execution:`, error.message);
    }
  }

  async removeJob(id) {
    try {
      await this.ensureConnection();
      await client.multi()
        .del(`job:${id}`)
        .zRem('scheduled_jobs', id)
        .exec();
    } catch (error) {
      console.error(`[PersistentStore] Failed to remove job ${id}:`, error.message);
    }
  }
}
