import { JobStore } from '../src/store';  

// Mock Job class for testing (since JobStore uses Job properties)
class MockJob {
  constructor(id, schedule) {
    this.id = id;
    this.schedule = schedule;
    this.status = 'pending';
  }
}

describe('JobStore Class', () => {
  let store;

  // Reset store before each test for isolation
  beforeEach(() => {
    store = new JobStore();
  });

  // Test 1: Constructor initializes empty Maps
  it('should initialize with empty jobs and scheduled Maps', () => {
    expect(store.jobs.size).toBe(0);
    expect(store.scheduled.size).toBe(0);
  });

  // Test 2: addJob adds to jobs and scheduled Maps
  it('should add a job to jobs and scheduled Maps', () => {
    const job = new MockJob('job1', 1000);
    const returnedId = store.addJob(job);

    expect(returnedId).toBe('job1');
    expect(store.jobs.size).toBe(1);
    expect(store.jobs.get('job1')).toBe(job);
    expect(store.scheduled.size).toBe(1);
    expect(store.scheduled.get(1000)).toEqual(['job1']);
  });

  // Test 3: addJob handles multiple jobs at same time
  it('should add multiple jobs to the same schedule time', () => {
    const job1 = new MockJob('job1', 1000);
    const job2 = new MockJob('job2', 1000);
    store.addJob(job1);
    store.addJob(job2);

    expect(store.jobs.size).toBe(2);
    expect(store.scheduled.get(1000)).toEqual(['job1', 'job2']);
  });

  // Test 4: getDueJobs returns pending jobs <= now and deletes entry
  it('should return due jobs and remove from scheduled', () => {
    const job1 = new MockJob('job1', 1000);  // Past
    const job2 = new MockJob('job2', 2000);  // Future
    store.addJob(job1);
    store.addJob(job2);

    const due = store.getDueJobs(1500);  // Now = 1500, so only job1

    expect(due).toHaveLength(1);
    expect(due[0]).toBe(job1);
    expect(store.scheduled.size).toBe(1);  // Only 2000 remains
    expect(store.scheduled.has(1000)).toBe(false);
  });

  // Test 5: getDueJobs skips non-pending or missing jobs
  it('should only return pending due jobs', () => {
    const job1 = new MockJob('job1', 1000);
    job1.status = 'completed';  // Not pending
    const job2 = new MockJob('job2', 1000);
    store.addJob(job1);
    store.addJob(job2);
    store.jobs.delete('job2');  // Simulate missing job

    const due = store.getDueJobs(1000);

    expect(due).toHaveLength(0);  // Skips non-pending and missing
    expect(store.scheduled.has(1000)).toBe(false);  // Still deletes entry
  });

  // Test 6: getDueJobs returns empty if no due jobs
  it('should return empty array if no jobs are due', () => {
    const job = new MockJob('job1', 2000);  // Future
    store.addJob(job);

    const due = store.getDueJobs(1000);

    expect(due).toHaveLength(0);
    expect(store.scheduled.size).toBe(1);  // Entry remains
  });

  // Test 7: updateJobStatus changes status if job exists
  it('should update job status', () => {
    const job = new MockJob('job1', 1000);
    store.addJob(job);

    store.updateJobStatus('job1', 'running');

    expect(store.jobs.get('job1').status).toBe('running');
  });

  // Test 8: updateJobStatus does nothing if job missing
  it('should not throw if updating non-existent job', () => {
    expect(() => store.updateJobStatus('missing', 'failed')).not.toThrow();
    expect(store.jobs.size).toBe(0);
  });

  // Test 9: removeJob deletes from jobs Map
  it('should remove job from jobs Map', () => {
    const job = new MockJob('job1', 1000);
    store.addJob(job);

    store.removeJob('job1');

    expect(store.jobs.size).toBe(0);
    // Note: Doesn't auto-remove from scheduled; that's scheduler's job
    expect(store.scheduled.get(1000)).toEqual(['job1']);  // Orphan ID remains, but harmless since getDueJobs checks jobs Map
  });

  // Test 10: Edge case - addJob with same ID overwrites
  it('should overwrite if adding job with existing ID', () => {
    const job1 = new MockJob('job1', 1000);
    const job2 = new MockJob('job1', 2000);  // Same ID, different time
    store.addJob(job1);
    store.addJob(job2);

    expect(store.jobs.size).toBe(1);
    expect(store.jobs.get('job1').schedule).toBe(2000);  // Updated
    expect(store.scheduled.get(1000)).toBeUndefined();  // Old not removed, but new added
    expect(store.scheduled.get(2000)).toEqual(['job1']);
  });
});