// HandlerRegistry - Central in-memory registry for job handlers
// Functions are NEVER persisted to Redis, only handler names
export class HandlerRegistry {
  constructor() {
    this.handlers = new Map();
  }
  
  // Register a handler by name
  register(name, handlerFn) {
    if (typeof handlerFn !== 'function') {
      throw new Error(`Handler "${name}" must be a function`);
    }
    this.handlers.set(name, handlerFn);
    return this;
  }
  
  // Get handler function by name
  get(name) {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`Handler "${name}" not found in registry`);
    }
    return handler;
  }
  
  // Check if handler exists
  has(name) {
    return this.handlers.has(name);
  }
  
  // Remove handler
  remove(name) {
    this.handlers.delete(name);
  }
  
  // Get all handler names
  keys() {
    return Array.from(this.handlers.keys());
  }
  
  // Clear all handlers
  clear() {
    this.handlers.clear();
  }
}

// Create default instance with built-in handlers
export const defaultRegistry = new HandlerRegistry()
  .register('consoleHandler', (data) => {
    console.log('Job executed:', data);
  })
  .register('emailHandler', (data) => {
    console.log('Sending email:', data);
  })
  .register('defaultHandler', (data) => {
    console.log('Default handler:', data);
  });
