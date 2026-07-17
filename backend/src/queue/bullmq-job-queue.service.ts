import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import type Redis from "ioredis";
import type { JobQueue } from "./job-queue.interface";

const JOB_NAME = "job";

/** Real, durable, retried-with-backoff job queue backed by Redis via BullMQ. */
@Injectable()
export class BullMqJobQueue implements JobQueue, OnApplicationShutdown {
  private readonly logger = new Logger(BullMqJobQueue.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers: Worker[] = [];

  // BullMQ needs its own dedicated connection (it issues blocking commands the
  // general-purpose REDIS_CLIENT shouldn't be tied up with), hence a separate `Redis`
  // instance rather than reusing redis.module.ts's client.
  constructor(private readonly connection: Redis) {}

  registerProcessor<T>(queueName: string, handler: (data: T) => Promise<void>): void {
    const worker = new Worker<T>(
      queueName,
      async (job) => {
        await handler(job.data);
      },
      { connection: this.connection },
    );
    worker.on("failed", (job, error) => {
      this.logger.error(`Job ${job?.id} on queue "${queueName}" failed: ${error.message}`);
    });
    this.workers.push(worker);
  }

  async enqueue<T>(queueName: string, data: T): Promise<void> {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, { connection: this.connection });
      this.queues.set(queueName, queue);
    }
    await queue.add(JOB_NAME, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
    // BullMQ only closes connections it creates internally (each Worker/Queue duplicates
    // the supplied connection for its own use) — it explicitly does not take ownership of
    // a connection passed in from outside, so the one this class created itself has to be
    // closed here too, or its socket stays open and the process never exits cleanly.
    this.connection.disconnect();
  }
}
