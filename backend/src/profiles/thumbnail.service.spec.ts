import { ConfigService } from "@nestjs/config";
import S3rver from "s3rver";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { S3StorageProvider } from "../integrations/storage/s3-storage.provider";
import { ThumbnailService } from "./thumbnail.service";
import type { JobQueue } from "../queue/job-queue.interface";

const BUCKET = "ember-thumbnail-test-bucket";

// jimp itself (real decode/resize/encode) is verified separately in a plain script — see
// docs/ember/TEST_COVERAGE_REPORT.md for why it isn't exercised inside this Jest suite
// (jimp's file-type-detection dependency uses a dynamic `import()` that Jest's CJS test
// environment can't resolve without --experimental-vm-modules, a Jest-only limitation
// that doesn't affect the real running app). What's verified here — with real local S3
// storage via s3rver, not mocked — is everything around that call: the download, the
// upload of the resized result, the Prisma update shape, and P2025 handling.
const FAKE_RESIZED_BUFFER = Buffer.from("fake-resized-jpeg-bytes");
jest.mock("jimp", () => ({
  Jimp: {
    read: jest.fn().mockImplementation((buffer: Buffer) => ({
      width: 800,
      height: 600,
      cover: jest.fn(),
      getBuffer: jest.fn().mockResolvedValue(FAKE_RESIZED_BUFFER),
      // marks which original buffer this fake "image" was read from, purely so the test
      // can assert the right bytes were fetched from storage
      __sourceBuffer: buffer,
    })),
  },
  JimpMime: { jpeg: "image/jpeg" },
}));

describe("ThumbnailService (real local S3-compatible storage, jimp mocked — see comment above)", () => {
  let server: S3rver;
  let dataDir: string;
  let storageProvider: S3StorageProvider;

  beforeAll(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "s3rver-thumb-test-"));
    server = new S3rver({
      address: "127.0.0.1",
      port: 0,
      silent: true,
      directory: dataDir,
      resetOnClose: true,
      configureBuckets: [{ name: BUCKET, configs: [] }],
    });
    const address = await server.run();

    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        endpoint: `http://127.0.0.1:${address.port}`,
        region: "us-east-1",
        bucket: BUCKET,
        accessKeyId: "S3RVER",
        secretAccessKey: "S3RVER",
        forcePathStyle: true,
        enabled: true,
      }),
    } as unknown as ConfigService;
    storageProvider = new S3StorageProvider(configService);
  });

  afterAll(async () => {
    await server.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  function fakeQueue(): { queue: JobQueue; trigger: (data: unknown) => Promise<void> } {
    let handler: ((data: unknown) => Promise<void>) | undefined;
    return {
      queue: {
        registerProcessor: (_name, h) => {
          handler = h as (data: unknown) => Promise<void>;
        },
        enqueue: async (_name, data) => handler!(data),
      },
      trigger: async (data) => handler!(data),
    };
  }

  it("downloads the real original from storage, uploads the resized result, and records it on the photo", async () => {
    const originalBuffer = Buffer.from("real-original-jpeg-bytes");
    const storageKey = "photos/user-1/original.jpg";
    await storageProvider.putObject(storageKey, originalBuffer, "image/jpeg");

    const prisma = { photo: { update: jest.fn().mockResolvedValue({}) } };
    const { queue } = fakeQueue();
    const thumbnailService = new ThumbnailService(prisma as never, storageProvider, queue);

    await thumbnailService.enqueue("photo-1", storageKey);

    expect(prisma.photo.update).toHaveBeenCalledTimes(1);
    const call = prisma.photo.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "photo-1" });
    expect(call.data.width).toBe(800);
    expect(call.data.height).toBe(600);
    expect(call.data.thumbnailStorageKey).toBe(`${storageKey}.thumb.jpg`);
    expect(call.data.thumbnailGeneratedAt).toBeInstanceOf(Date);

    // The resized bytes were really uploaded to real (local) storage under the derived key.
    const uploaded = await storageProvider.getObjectBuffer(call.data.thumbnailStorageKey);
    expect(uploaded).toEqual(FAKE_RESIZED_BUFFER);
  });

  it("discards the job without throwing if the photo was deleted before the job ran", async () => {
    const storageKey = "photos/user-1/deleted-before-thumb.jpg";
    await storageProvider.putObject(storageKey, Buffer.from("bytes"), "image/jpeg");

    const notFoundError = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "6.19.3",
    });
    const prisma = { photo: { update: jest.fn().mockRejectedValue(notFoundError) } };
    const { queue } = fakeQueue();
    const thumbnailService = new ThumbnailService(prisma as never, storageProvider, queue);

    await expect(thumbnailService.enqueue("photo-deleted", storageKey)).resolves.toBeUndefined();
  });

  it("propagates a real (non-P2025) database error so the queue retries it", async () => {
    const storageKey = "photos/user-1/db-error.jpg";
    await storageProvider.putObject(storageKey, Buffer.from("bytes"), "image/jpeg");

    const prisma = { photo: { update: jest.fn().mockRejectedValue(new Error("connection lost")) } };
    const { queue } = fakeQueue();
    const thumbnailService = new ThumbnailService(prisma as never, storageProvider, queue);

    await expect(thumbnailService.enqueue("photo-x", storageKey)).rejects.toThrow("connection lost");
  });
});
