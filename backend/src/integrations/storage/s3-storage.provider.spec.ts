import { ConfigService } from "@nestjs/config";
import S3rver from "s3rver";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { S3StorageProvider } from "./s3-storage.provider";

const BUCKET = "ember-test-bucket";

// Verifies the real adapter against a real (if local, in-process) S3-compatible server —
// genuine HTTP requests, genuine AWS SigV4-signed presigned URLs fetched with a plain
// `fetch()` exactly as a browser client would, not a mocked S3Client. Mirrors this
// project's established practice of testing integrations against something real.
describe("S3StorageProvider (against a real local S3-compatible server)", () => {
  let server: S3rver;
  let endpoint: string;
  let dataDir: string;
  let provider: S3StorageProvider;

  beforeAll(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "s3rver-test-"));
    server = new S3rver({
      address: "127.0.0.1",
      port: 0,
      silent: true,
      directory: dataDir,
      resetOnClose: true,
      configureBuckets: [{ name: BUCKET, configs: [] }],
    });
    const address = await server.run();
    endpoint = `http://127.0.0.1:${address.port}`;

    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        endpoint,
        region: "us-east-1",
        bucket: BUCKET,
        accessKeyId: "S3RVER",
        secretAccessKey: "S3RVER",
        forcePathStyle: true,
        enabled: true,
      }),
    } as unknown as ConfigService;
    provider = new S3StorageProvider(configService);
  });

  afterAll(async () => {
    await server.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("issues a presigned upload URL that a plain PUT can actually use, then reads it back", async () => {
    const upload = await provider.createPresignedUpload("user-1", "image/jpeg");
    expect(upload.storageKey).toMatch(/^photos\/user-1\/.+\.jpg$/);

    const body = Buffer.from("fake-jpeg-bytes");
    const putRes = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body,
    });
    expect(putRes.ok).toBe(true);

    const head = await provider.headObject(upload.storageKey);
    expect(head).not.toBeNull();
    expect(head!.contentType).toBe("image/jpeg");
    expect(head!.byteSizeBytes).toBe(body.length);

    const readUrl = await provider.getReadUrl(upload.storageKey);
    const getRes = await fetch(readUrl);
    expect(getRes.ok).toBe(true);
    expect(Buffer.from(await getRes.arrayBuffer())).toEqual(body);
  });

  it("rejects an unsupported content type before ever contacting storage", async () => {
    await expect(provider.createPresignedUpload("user-1", "application/pdf")).rejects.toThrow(/Unsupported content type/);
  });

  it("headObject returns null for an object that was never uploaded", async () => {
    const result = await provider.headObject("photos/user-1/does-not-exist.jpg");
    expect(result).toBeNull();
  });

  it("putObject + getObjectBuffer round-trips server-side writes (the thumbnail pipeline's path)", async () => {
    const key = "photos/user-1/server-written.jpg";
    const content = Buffer.from("server-generated-thumbnail-bytes");
    await provider.putObject(key, content, "image/jpeg");

    const readBack = await provider.getObjectBuffer(key);
    expect(readBack).toEqual(content);
  });

  it("deleteObject removes the object", async () => {
    const key = "photos/user-1/to-delete.jpg";
    await provider.putObject(key, Buffer.from("bytes"), "image/jpeg");
    expect(await provider.headObject(key)).not.toBeNull();

    await provider.deleteObject(key);
    expect(await provider.headObject(key)).toBeNull();
  });
});
