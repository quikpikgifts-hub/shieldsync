import { Inject, Injectable, Logger } from "@nestjs/common";
import { Jimp, JimpMime } from "jimp";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { STORAGE_PROVIDER, type StorageProvider } from "../integrations/storage/storage-provider.interface";
import { JOB_QUEUE, type JobQueue } from "../queue/job-queue.interface";

const THUMBNAIL_QUEUE_NAME = "thumbnails";
const THUMBNAIL_SIZE_PX = 320;

interface ThumbnailJob {
  photoId: string;
  storageKey: string;
}

/**
 * Runs in the background (BullMQ when Redis is configured, inline otherwise — see
 * queue.module.ts) after a photo is registered, so the request that registers a photo
 * doesn't have to wait on downloading, resizing, and re-uploading the full-size original.
 */
@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
    @Inject(JOB_QUEUE) private readonly jobQueue: JobQueue,
  ) {
    this.jobQueue.registerProcessor<ThumbnailJob>(THUMBNAIL_QUEUE_NAME, (job) => this.generate(job));
  }

  async enqueue(photoId: string, storageKey: string): Promise<void> {
    await this.jobQueue.enqueue<ThumbnailJob>(THUMBNAIL_QUEUE_NAME, { photoId, storageKey });
  }

  private async generate(job: ThumbnailJob): Promise<void> {
    const original = await this.storageProvider.getObjectBuffer(job.storageKey);
    const image = await Jimp.read(original);
    const { width: originalWidth, height: originalHeight } = image;

    image.cover({ w: THUMBNAIL_SIZE_PX, h: THUMBNAIL_SIZE_PX });
    const thumbnailBuffer = await image.getBuffer(JimpMime.jpeg);

    const thumbnailStorageKey = `${job.storageKey}.thumb.jpg`;
    await this.storageProvider.putObject(thumbnailStorageKey, thumbnailBuffer, "image/jpeg");

    try {
      await this.prisma.photo.update({
        where: { id: job.photoId },
        data: {
          thumbnailStorageKey,
          width: originalWidth,
          height: originalHeight,
          thumbnailGeneratedAt: new Date(),
        },
      });
    } catch (error) {
      // The photo may have been deleted between registration and this job running — not
      // a transient failure the queue's retry logic should burn attempts on.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        this.logger.warn(`Photo ${job.photoId} no longer exists — discarding its thumbnail job`);
        return;
      }
      throw error;
    }

    this.logger.log(`Generated thumbnail for photo ${job.photoId} (${originalWidth}x${originalHeight} original)`);
  }
}
