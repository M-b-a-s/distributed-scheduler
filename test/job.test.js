import { Job } from "../src/job"; 

describe('Job Class', () => {
  // Test 1: Basic initialization with all parameters
  it('should initialize with provided id, schedule, handler, and data', () => {
    const id = 'test-job-1';
    const schedule = Date.now() + 10000;  // Future timestamp
    const handler = () => console.log('Test handler');
    const data = { key: 'value' };

    const job = new Job(id, schedule, handler, data);

    expect(job.id).toBe(id); 
    expect(job.schedule).toBe(schedule);  
    expect(job.handler).toBe(handler);
    expect(job.data).toEqual(data);
    expect(job.status).toBe('pending'); 
    expect(job.createdAt).toBeGreaterThanOrEqual(Date.now() - 1000); 
  });

  // Test 2: Default data when not provided
  it('should default data to empty object if not provided', () => {
    const id = 'test-job-2';
    const schedule = Date.now() + 20000;
    const handler = () => {};

    const job = new Job(id, schedule, handler);

    expect(job.data).toEqual({});  // Empty object as fallback
    expect(job.status).toBe('pending');  // Still pending
  });

  // Test 3: Status is always 'pending' initially
  it('should set status to pending by default', () => {
    const job = new Job('test-job-3', Date.now(), () => {});

    expect(job.status).toBe('pending');  // No other initial status
  });

  // Test 4: createdAt is set automatically
  it('should set createdAt to current timestamp', () => {
    const before = Date.now();
    const job = new Job('test-job-4', Date.now(), () => {});
    const after = Date.now();

    expect(job.createdAt).toBeGreaterThanOrEqual(before);
    expect(job.createdAt).toBeLessThanOrEqual(after);  // Within test execution time
  });

  // Test 5: Edge case - Invalid inputs (optional, for robustness)
  it('should throw error if required params are missing', () => {
    expect(() => new Job()).toThrow();
    expect(() => new Job('id')).toThrow();  
    expect(() => new Job('id', Date.now())).toThrow();
  });
});