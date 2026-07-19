import { Injectable, Logger } from "@nestjs/common";
import type { JobQueue } from "./job-queue.interface";
import { safeErrorMessage } from "../common/logging/safe-error";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

/**
 * Fallback used when Redis isn't configured. Runs the job immediately, in-process, with
 * its own bounded exponential-backoff retry — not durable across a process restart, but a
 * reasonable single-instance default so email/thumbnail generation isn't hard-blocked on
 * standing up Redis for local dev. See BullMqJobQueue for the production-shape equivalent.
 */
@Injectable()
export class InlineJobQueue implements JobQueue {
  private readonly logger = new Logger(InlineJobQueue.name);
  private readonly handlers = new Map<string, (data: unknown) => Promise<void>>();

  registerProcessor<T>(queueName: string, handler: (data: T) => Promise<void>): void {
    this.handlers.set(queueName, handler as (data: unknown) => Promise<void>);
  }

  async enqueue<T>(queueName: string, data: T): Promise<void> {
    const handler = this.handlers.get(queueName);
    if (!handler) {
      throw new Error(`No processor registered for queue "${queueName}"`);
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        await handler(data);
        return;
      } catch (error) {
        if (attempt === MAX_ATTEMPTS) {
          this.logger.error(`Job on queue "${queueName}" failed after ${MAX_ATTEMPTS} attempts`, safeErrorMessage(error));
          throw error;
        }
        this.logger.warn(`Job on queue "${queueName}" failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying`);
        await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
