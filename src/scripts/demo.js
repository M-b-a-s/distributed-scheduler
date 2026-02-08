import { JobStore } from '../store/jobStore.js';
import { Scheduler } from '../scheduler/scheduler.js';
import { defaultRegistry } from '../registry/handlerRegistry.js';

// Enhanced handler that returns results
defaultRegistry.register('demoHandler', async (data) => {
  console.log(`\n🎯 [HANDLER] demoHandler executing with data:`, JSON.stringify(data));
  
  // Simulate work (e.g., API call, database operation)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a result
  return {
    success: true,
    processed: data.count || 1,
    timestamp: new Date().toISOString()
  };
});

defaultRegistry.register('longRunningHandler', async (data) => {
  console.log(`\n🎯 [HANDLER] longRunningHandler executing with data:`, JSON.stringify(data));
  
  // Simulate long-running task
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return {
    success: true,
    task: 'long-running',
    completedAt: new Date().toISOString()
  };
});

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║           DISTRIBUTED SCHEDULER - DEMO MODE                 ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Create store and scheduler with handler registry
const store = new JobStore(defaultRegistry);
const scheduler = new Scheduler(store);

// Initialize store (loads jobs from Redis)
await store.init();

// Start the scheduler
scheduler.start();

console.log('\n📋 Available handlers:', defaultRegistry.keys());
console.log('\n' + '='.repeat(70));
console.log('SCHEDULING DEMO JOBS');
console.log('='.repeat(70));

// Schedule demo jobs
const job1Id = scheduler.scheduleJob('demoHandler', 3000, { 
  message: 'First demo job', 
  count: 42 
});

const job2Id = scheduler.scheduleJob('longRunningHandler', 8000, { 
  message: 'Long-running job',
  taskId: 'TASK-001'
});

console.log('\n⏰ Jobs will execute in:');
console.log('   • job1 (~3 seconds): First demo job');
console.log('   • job2 (~8 seconds): Long-running job');
console.log('\n👀 Watch the console below for execution logs...\n');
console.log('─'.repeat(70));

// Stop scheduler after 15 seconds
setTimeout(() => {
  console.log('\n' + '─'.repeat(70));
  console.log('\n⏹️  Demo complete - stopping scheduler...\n');
  scheduler.stop();
  process.exit(0);
}, 15000);
