import { JobStore } from './store/jobStore.js';
import { Scheduler } from './scheduler/scheduler.js';
import { defaultRegistry } from './registry/handlerRegistry.js';

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          DISTRIBUTED SCHEDULER - PRODUCTION MODE             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Initialize store with HandlerRegistry (functions stay in memory)
    const store = new JobStore(defaultRegistry);
    await store.init(); // Recover jobs from Redis

    const scheduler = new Scheduler(store);
    scheduler.start();
    
    console.log('📋 Registered handlers:', defaultRegistry.keys());
    console.log('🔗 Redis: Connected');
    console.log('⏰ Tick interval: 1 second');
    console.log('\n👀 Scheduler is running and monitoring for jobs...\n');

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Received SIGINT (Ctrl+C) - Shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Received SIGTERM - Shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('🔴 Uncaught Exception:', error);
      scheduler.stop();
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🔴 Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (error) {
    console.error('\n🔴 Failed to start scheduler:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
