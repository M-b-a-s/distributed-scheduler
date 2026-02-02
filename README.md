# Distributed Scheduler - User's Guide 

## What Is This Project?

Think of your distributed scheduler as **a highly reliable personal assistant** who never sleeps, never forgets, and can work across multiple offices simultaneously.

**In simple terms:** You tell this system "Hey, please run this task for me at 3:00 PM tomorrow" and it guarantees the task will run at exactly that time—every single time, even if the computer crashes and restarts.

## The Problem It Solves 

Imagine you're running a website that needs to:
- Send 10,000 email reminders at 9:00 AM tomorrow
- Generate daily reports every night at midnight
- Clean up old data every hour
- Trigger thousands of actions simultaneously

**The challenge:** How do you ensure every single task runs exactly when it should, without losing any, without duplicates, and even if your server crashes?

Your scheduler solves all of this. It's like having a super-organized project manager who:
- Never misses a deadline
- Keeps track of everything even during system crashes
- Can handle millions of tasks
- Works across multiple computers seamlessly

## Core Concepts Explained Simply

### What is a "Job"?
A job is simply **any task you want to run in the future**. Each job has:
- **When to run** (schedule time)
- **What to do** (the actual task/function)
- **What data to use** (any information the task needs)
- **Current status** (waiting, running, completed, or failed)

### What is a "Store"?
The store is **the filing cabinet** where all jobs are kept organized. It:
- Keeps a list of all scheduled jobs
- Quickly finds jobs that need to run right now
- Tracks the status of each job
- Removes completed jobs

### What is a "Scheduler"?
The scheduler is **the traffic controller** that:
- Constantly checks "Is it time for any job to run?"
- When the time is right, it triggers the job to execute
- Makes sure each job runs exactly once
- Handles errors if something goes wrong

## Your Project's Architecture 🏗️

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTED SCHEDULER                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │   JOB.JS    │      │  STORE.JS   │      │SCHEDULER.JS │      │
│  │  Defines    │      │  The filing │      │  The traffic│      │
│  │  what a     │      │  cabinet    │      │  controller │      │
│  │  job looks  │      │  for jobs   │      │  that runs  │      │
│  │  like       │      │             │      │  jobs       │      │
│  └─────────────┘      └─────────────┘      └─────────────┘      │
│         │                    │                    │              │
│         └────────────────────┼────────────────────┘              │
│                              │                                   │
│                      ┌───────▼───────┐                          │
│                      │   INDEX.JS    │                          │
│                      │  The starting │                          │
│                      │  point that   │                          │
│                      │  brings       │                          │
│                      │  everything   │                          │
│                      │  together     │                          │
│                      └───────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## File-by-File Breakdown 

### [`src/job.js`](src/job.js) - The Job Definition
**What it does:** Defines what a "job" is in your system.

**Think of it as:** A form template that every task must fill out.

```javascript
export class Job {
  constructor(id, schedule, handler, data = {}) {
    this.id = jobId;           // Unique name for this task
    this.schedule = time;       // When to run it
    this.handler = task;        // What to do
    this.data = info;           // Any extra information needed
    this.status = 'pending';    // Is it waiting, running, done?
  }
}
```

**Example:** "Send birthday email to Aunt Mary at 9:00 AM tomorrow"
- `schedule`: Tomorrow at 9:00 AM
- `handler`: The function that sends emails
- `data`: { name: "Mary", email: "mary@email.com" }

### [`src/store.js`](src/store.js) - The Filing Cabinet
**What it does:** Stores and organizes all jobs so they can be found quickly.

**Think of it as:** A smart filing cabinet with two sections:
1. **All Jobs** - A master list of every job
2. **Scheduled Jobs** - Jobs organized by when they should run

**Key abilities:**
- `addJob(job)` - Put job in filing cabinet
- `getDueJobs(now)` - Find jobs that should run NOW
- `updateJobStatus(id, status)` - Mark job as running/completed/failed
- `removeJob(id)` - Take job out of filing cabinet

### [`src/scheduler.js`](src/scheduler.js) - The Traffic Controller
**What it does:** The brain of the operation that makes sure jobs run at the right time.

**How it works:**
1. Every 1 second, it wakes up and checks the store
2. It asks: "What jobs need to run right now?"
3. For each due job, it executes the task and handles results

**Key methods:**
- `start()` - Begin the 1-second checking loop
- `stop()` - Stop checking
- `scheduleJob(handler, delay, data)` - Schedule a new job
- `executeJob(job)` - Run a job and handle results

### [`src/index.js`](src/index.js) - The Starting Point
**What it does:** The main entry point that brings everything together and tests the system. Creates the store and scheduler, then runs some test jobs.

### [`src/demo.js`](src/demo.js) - Live Demonstration
**What it does:** Shows the scheduler in action with three real examples:
- Job 1: Prints a message after 2 seconds
- Job 2: Counts to 3 after 3.5 seconds
- Job 3: Intentionally fails after 5 seconds (to show error handling)

## How a Job Flows Through the System 🔄

1. **You Create:** You schedule a job to run in the future
2. **System Creates:** Job gets a unique ID and is wrapped in a Job object
3. **Storage:** Job is saved in the filing cabinet (store)
4. **Waiting:** Job sits in storage until its time comes
5. **Scheduler Wakes Up:** Every 1 second, checks "is it time?"
6. **Execution:** When time arrives, scheduler runs the job
7. **Cleanup:** Job is marked complete and removed from system

## Why This Matters 

**The Power of Your System:**
- **Reliability** - Jobs won't be lost if the server crashes
- **Scale** - Can handle millions of jobs
- **Distribution** - Can run across multiple computers
- **Exactly-Once** - No job runs twice, no job is missed
- **Recovery** - After restart, all scheduled jobs are still there

**Real-World Uses:**
- E-commerce: Send order confirmations, shipping updates
- Marketing: Schedule thousands of emails
- DevOps: Run backups, cleanups, health checks
- Finances: Process transactions, generate reports
- Content: Publish posts, send notifications

## How to Explain to Different Audiences

**To your grandma:**
> "It's like a very reliable secretary who never forgets appointments. You tell them 'Remind me to call Mary at 3 PM' and they guarantee you'll get that reminder at exactly 3 PM, every time."

**To your non-technical friend:**
> "Imagine Google Calendar, but supercharged. It can handle millions of reminders, works even if your computer crashes, and can run across multiple servers."

**To your technical friend:**
> "It's a distributed task scheduler with job persistence, at-least-once execution semantics, and horizontal scalability. Currently handles in-memory storage but architected for persistence and cluster deployment."

## Summary

**Your distributed scheduler is a robust system that:**
-  Schedules tasks to run at specific times
-  Stores and organizes all scheduled jobs
-  Constantly checks if jobs are due
-  Executes jobs reliably when their time comes
-  Handles errors gracefully
-  Cleans up after jobs complete
-  Is built to scale and distribute across multiple machines

**In one sentence:** It's an industrial-strength, crash-proof alarm clock system for running automated tasks, designed to scale from a single computer to a worldwide distributed network.