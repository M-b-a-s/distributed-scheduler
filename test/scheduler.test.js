import { it, jest } from '@jest/globals'
import { Scheduler } from '../src/scheduler'; 

// Mock Job and JobStore
class MockJob {
  constructor(id, schedule, handler, data) {
    this.id = id;
    this.schedule = schedule;
    this.handler = handler;
    this.data = data;
    this.status = 'pending';
  }
}

class MockStore {
  constructor() {
    this.jobs = new Map();
    this.scheduled = new Map();
    this.addJob = jest.fn((job) => this.jobs.set(job.id, job));
    this.getDueJobs = jest.fn(() => []);
    this.updateJobStatus = jest.fn();
    this.removeJob = jest.fn();
  }
}

describe('Scheduler Class', () => {
  let scheduler;
  let mockStore;

  beforeEach(() => {
    jest.spyOn(global, 'setInterval');
    jest.useFakeTimers();  // Control time and intervals
    mockStore = new MockStore();
    scheduler = new Scheduler(mockStore);
    jest.spyOn(console, 'log').mockImplementation(() => {});  // Spy on logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // Test 1: Constructor sets up properly
  it('should initialize with store and not running', () => {
    expect(scheduler.store).toBe(mockStore);
    expect(scheduler.isRunning).toBe(false);
    expect(scheduler.intervalId).toBe(null);
  });

  // Test 2: start begins the loop and calls tick
  it.only('should start the scheduler and schedule interval', () => {
    scheduler.start();

    expect(scheduler.isRunning).toBe(true);
    expect(console.log).toHaveBeenCalledWith('Scheduler started');
    // expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);

    // Simulate immediate tick
    expect(mockStore.getDueJobs).toHaveBeenCalledWith(expect.any(Number));
  });

  // Test 3: start does nothing if already running
  it('should not start if already running', () => {
    scheduler.start();
    scheduler.start();  // Second call

    expect(setInterval).toHaveBeenCalledTimes(1);  // Only once
  });

  // Test 4: stop clears interval and stops
  it('should stop the scheduler', () => {
    scheduler.start();
    scheduler.stop();

    expect(scheduler.isRunning).toBe(false);
    expect(clearInterval).toHaveBeenCalledWith(scheduler.intervalId);
    expect(console.log).toHaveBeenCalledWith('Scheduler stopped');
  });

  // Test 5: stop does nothing if not running
  it('should not stop if not running', () => {
    scheduler.stop();
    expect(clearInterval).not.toHaveBeenCalled();
  });

  // Test 6: tick fetches and executes due jobs
  it('should get due jobs and execute them in tick', () => {
    const mockHandler = jest.fn().mockResolvedValue();
    const mockJob = new MockJob('job1', Date.now(), mockHandler, {});
    mockStore.getDueJobs.mockReturnValue([mockJob]);

    scheduler.tick();

    expect(mockStore.getDueJobs).toHaveBeenCalledWith(expect.any(Number));
    expect(mockStore.updateJobStatus).toHaveBeenCalledWith('job1', 'running');
    expect(mockHandler).toHaveBeenCalledWith({});
    expect(mockStore.updateJobStatus).toHaveBeenCalledWith('job1', 'completed');
    expect(mockStore.removeJob).toHaveBeenCalledWith('job1');
  });

  // Test 7: executeJob handles errors
  it('should handle job execution errors', async () => {
    const mockHandler = jest.fn().mockRejectedValue(new Error('Fail'));
    const mockJob = new MockJob('job1', Date.now(), mockHandler, {});
    await scheduler.executeJob(mockJob);

    expect(mockStore.updateJobStatus).toHaveBeenCalledWith('job1', 'running');
    expect(mockHandler).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Job job1 failed:'), expect.any(Error));
    expect(mockStore.updateJobStatus).toHaveBeenCalledWith('job1', 'failed');
    expect(mockStore.removeJob).not.toHaveBeenCalled();  // Not removed on failure
  });

  // Test 8: scheduleJob creates and adds job
  it('should schedule a job with unique ID', () => {
    const handler = () => {};
    const delay = 5000;
    const data = { key: 'value' };

    const jobId = scheduler.scheduleJob(handler, delay, data);

    expect(jobId).toMatch(/^job-\d+-[a-z0-9]+$/);
    expect(mockStore.addJob).toHaveBeenCalledWith(expect.objectContaining({
      id: jobId,
      schedule: expect.any(Number),
      handler,
      data,
      status: 'pending'
    }));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`Scheduled job ${jobId}`));
  });

  // Test 9: Edge case - tick with no due jobs
  it('should handle tick with no due jobs', () => {
    mockStore.getDueJobs.mockReturnValue([]);

    scheduler.tick();

    expect(mockStore.getDueJobs).toHaveBeenCalled();
    // No executions
  });

  // Test 10: Interval triggers multiple ticks
  it('should trigger ticks via interval', () => {
    scheduler.start();

    // Advance time by 1000ms
    jest.advanceTimersByTime(1000);

    expect(mockStore.getDueJobs).toHaveBeenCalledTimes(2);  // Initial + one interval
  });
});