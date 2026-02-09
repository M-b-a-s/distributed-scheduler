import { CronExpressionParser } from 'cron-parser';

/**
 * Validate a cron expression
 * @param {string} expression - Cron expression to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateCronExpression(expression) {
  if (!expression || typeof expression !== 'string') {
    return false;
  }
  try {
    CronExpressionParser.parse(expression);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Get the next execution time for a cron expression
 * @param {string} cronExpression - Cron expression
 * @param {number} [fromTime=Date.now()] - Starting time in milliseconds
 * @returns {number} - Next execution time as Unix timestamp
 * @throws {Error} - If cron expression is invalid
 */
export function getNextExecutionTime(cronExpression, fromTime = Date.now()) {
  if (!cronExpression) {
    throw new Error('Cron expression is required');
  }
  try {
    const options = {
      currentDate: new Date(fromTime),
      iterator: true
    };
    const interval = CronExpressionParser.parse(cronExpression, options);
    const next = interval.next();
    return next.getTime();
  } catch (err) {
    throw new Error(`Invalid cron expression: ${cronExpression}. ${err.message}`);
  }
}

/**
 * Get multiple future execution times for a cron expression
 * @param {string} cronExpression - Cron expression
 * @param {number} count - Number of future times to return
 * @param {number} [fromTime=Date.now()] - Starting time in milliseconds
 * @returns {number[]} - Array of future execution times
 * @throws {Error} - If cron expression is invalid
 */
export function getNextExecutionTimes(cronExpression, count, fromTime = Date.now()) {
  if (!cronExpression) {
    throw new Error('Cron expression is required');
  }
  if (count <= 0) {
    throw new Error('Count must be a positive number');
  }
  
  const times = [];
  try {
    const options = {
      currentDate: new Date(fromTime),
      iterator: true
    };
    const interval = CronExpressionParser.parse(cronExpression, options);
    
    for (let i = 0; i < count; i++) {
      const next = interval.next();
      times.push(next.getTime());
    }
  } catch (err) {
    throw new Error(`Invalid cron expression: ${cronExpression}. ${err.message}`);
  }
  return times;
}

/**
 * Get human-readable description of a cron expression
 * @param {string} cronExpression - Cron expression
 * @returns {string} - Human-readable description
 */
export function describeCronExpression(cronExpression) {
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    const next = interval.next();
    const prev = interval.prev();
    
    return `Next: ${next.toISOString()}, Previous: ${prev.toISOString()}`;
  } catch (err) {
    return `Invalid cron expression: ${err.message}`;
  }
}
