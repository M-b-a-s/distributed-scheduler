// addRecurringJobs.js - Test script for recurring jobs
import { JobStore } from '../store/jobStore.js';
import { Scheduler } from '../scheduler/scheduler.js';
import { defaultRegistry } from '../registry/handlerRegistry.js';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║          DISTRIBUTED SCHEDULER - RECURRING JOBS TEST         ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

async function main() {
  try {
    // Initialize store
    const store = new JobStore(defaultRegistry);
    await store.init();

    const scheduler = new Scheduler(store);
    
    console.log('\n📋 Registered handlers:', defaultRegistry.keys());
    console.log('🔗 Redis: Connected\n');
    
    console.log('═'.repeat(70));
    console.log('SCHEDULING RECURRING JOBS');
    console.log('═'.repeat(70) + '\n');
    
    // Schedule recurring jobs with different cron expressions
    // Format: second minute hour day-of-month month day-of-week
    // "* * * * * *" = every second
    // "*/5 * * * * *" = every 5 seconds
    // "0 * * * * *" = every hour at minute 0
    // "0 9 * * *" = every day at 9:00 AM
    // "0 9 * * 1" = every Monday at 9:00 AM
    
    // Test 1: Very frequent job (every 5 seconds) - good for quick testing
    const job1Id = scheduler.scheduleRecurringJob(
      'consoleHandler',
      '*/5 * * * * *',  // Every 5 seconds
      { 
        message: 'Recurring job - runs every 5 seconds',
        testId: 'job-5sec'
      }
    );
    console.log(`✅ Scheduled: ${job1Id}\n`);
    
    // Test 2: Hourly job
    const job2Id = scheduler.scheduleRecurringJob(
      'emailHandler',
      '0 * * * *',  // Every hour at minute 0
      { 
        message: 'Hourly email report',
        testId: 'job-hourly'
      }
    );
    console.log(`✅ Scheduled: ${job2Id}\n`);
    
    // Test 3: Daily job at 9 AM
    const job3Id = scheduler.scheduleRecurringJob(
      'defaultHandler',
      '0 9 * * *',  // Every day at 9:00 AM
      { 
        message: 'Daily summary at 9 AM',
        testId: 'job-daily'
      }
    );
    console.log(`✅ Scheduled: ${job3Id}\n`);
    
    console.log('═'.repeat(70));
    console.log('\n📊 SUMMARY');
    console.log('═'.repeat(70));
    console.log('\nScheduled recurring jobs:');
    console.log(`  1. ${job1Id} - Every 5 seconds`);
    console.log(`  2. ${job2Id} - Every hour`);
    console.log(`  3. ${job3Id} - Daily at 9 AM\n`);
    
    console.log('📝 To test the recurring jobs:');
    console.log('   1. Run: npm start');
    console.log('   2. The scheduler will pick up these recurring jobs');
    console.log('   3. After each execution, jobs will auto-reschedule\n');
    
    console.log('🛑 Press Ctrl+C to exit\n');
    
    // Keep the process running briefly to show the scheduled jobs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start scheduler to show it running (will stop after showing tick once)
    scheduler.start();
    
    // Wait a moment to show initial tick
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Stop scheduler (this is just a test script)
    scheduler.stop();
    
    console.log('\n✅ Recurring jobs scheduled successfully!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n🔴 Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
