# Build a Distributed Task Scheduler
My goal is to build a supercharged, industrial-strength cron system that can:

- Run millions of scheduled tasks
- Survive server crashes (persistence)
- Scale across multiple machines (distributed)
- Guarantee jobs run exactly once
- Handle system restarts without loosing jobs

Analogy: If setTimeout() is a kitchen timer, our scheduler is Google Calendar's notification system for the entire world.