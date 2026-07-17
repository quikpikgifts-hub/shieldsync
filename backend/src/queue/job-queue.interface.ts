export const JOB_QUEUE = Symbol("JOB_QUEUE");

/**
 * A minimal background-job abstraction. Two implementations: a real BullMQ/Redis-backed
 * one (durable across restarts, retried with backoff, visible in Redis) used when
 * REDIS_URL is configured, and an inline one (runs the handler immediately, in-process,
 * with its own retry loop) used otherwise — so email sending and thumbnail generation
 * work in local dev/CI without requiring Redis, at the cost of not surviving a process
 * restart mid-job. See queue.module.ts.
 */
export interface JobQueue {
  /** Registers the function that processes jobs of this name. Call once per job name at startup. */
  registerProcessor<T>(queueName: string, handler: (data: T) => Promise<void>): void;
  /** Enqueues a job for the processor registered under `queueName` to pick up. */
  enqueue<T>(queueName: string, data: T): Promise<void>;
}
