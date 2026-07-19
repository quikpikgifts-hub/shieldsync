import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import S3rver from "s3rver";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { ThumbnailService } from "../src/profiles/thumbnail.service";
import { resetDatabase } from "./db-test-utils";
import { registerUser, createProfile } from "./test-helpers";

const BUCKET = "ember-e2e-bucket";

// Unlike every other e2e-spec file, this one configures S3_* env vars (pointing at a real
// local S3-compatible server) *before* compiling the app, so ProfilesService's
// `storageEnabled` gate is genuinely on — exercising the real presigned-upload → validate
// → thumbnail-enqueue path end to end, not the D-05 fallback every other suite runs under.
describe("Photo storage (e2e, real local S3-compatible storage configured)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let s3: S3rver;
  let dataDir: string;

  beforeAll(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "s3rver-e2e-"));
    s3 = new S3rver({
      address: "127.0.0.1",
      port: 0,
      silent: true,
      directory: dataDir,
      resetOnClose: true,
      configureBuckets: [{ name: BUCKET, configs: [] }],
    });
    const address = await s3.run();
    const { port } = address as AddressInfo;

    process.env.S3_ENDPOINT = `http://127.0.0.1:${port}`;
    process.env.S3_BUCKET = BUCKET;
    process.env.S3_REGION = "us-east-1";
    process.env.S3_ACCESS_KEY_ID = "S3RVER";
    process.env.S3_SECRET_ACCESS_KEY = "S3RVER";
    process.env.S3_FORCE_PATH_STYLE = "true";

    // Real Jimp decode/resize is verified separately (thumbnail.service.spec.ts +
    // a standalone real-Node sanity check — see TEST_COVERAGE_REPORT.md for why it can't
    // run inside Jest directly). This suite's own concern is the upload/register/signed-URL
    // flow, so the actual background thumbnail job is stubbed out here rather than left to
    // fail noisily against Jest's dynamic-import limitation.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ThumbnailService)
      .useValue({ enqueue: jest.fn().mockResolvedValue(undefined) })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
    await s3.close();
    await fs.rm(dataDir, { recursive: true, force: true });
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_BUCKET;
    delete process.env.S3_REGION;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_FORCE_PATH_STYLE;
  });

  it("issues a presigned upload URL, accepts a real upload to it, and registers the photo with real metadata", async () => {
    const user = await registerUser(app);
    await createProfile(app, user.accessToken);

    const uploadUrlRes = await request(app.getHttpServer())
      .post("/profiles/me/photos/upload-url")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ contentType: "image/jpeg" });
    expect(uploadUrlRes.status).toBe(201);
    const { uploadUrl, storageKey } = uploadUrlRes.body;
    expect(storageKey).toMatch(new RegExp(`^photos/${user.id}/.+\\.jpg$`));

    const bytes = Buffer.from("real-uploaded-jpeg-bytes");
    const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: bytes });
    expect(putRes.ok).toBe(true);

    const registerRes = await request(app.getHttpServer())
      .post("/profiles/me/photos")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ storageKey, isPrimary: true });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.contentType).toBe("image/jpeg");
    expect(registerRes.body.byteSizeBytes).toBe(bytes.length);

    // GET /profiles/me returns a usable (signed) URL, not the raw internal storage key.
    const getOwnRes = await request(app.getHttpServer())
      .get("/profiles/me")
      .set("Authorization", `Bearer ${user.accessToken}`);
    expect(getOwnRes.status).toBe(200);
    const photo = getOwnRes.body.photos[0];
    expect(photo.url).toContain("http");
    expect(photo.url).not.toBe(storageKey);

    const fetchedViaSignedUrl = await fetch(photo.url);
    expect(fetchedViaSignedUrl.ok).toBe(true);
    expect(Buffer.from(await fetchedViaSignedUrl.arrayBuffer())).toEqual(bytes);

    // Regression coverage for the RC-1 finding this test guards: the raw S3 object key
    // must never appear in any client-facing response — only the short-lived signed URL.
    expect(photo).not.toHaveProperty("storageKey");
    expect(photo).not.toHaveProperty("thumbnailStorageKey");
  });

  it("rejects a second user registering the first user's real storageKey as their own photo", async () => {
    // Regression test for the RC-1 finding: registering a photo used to only check that
    // *some* object existed at the given storageKey (via headObject), never that the
    // caller was the one who uploaded it — so a storageKey read out of another user's
    // response (e.g. a candidate-deck entry) could be claimed as the reader's own photo.
    const owner = await registerUser(app);
    await createProfile(app, owner.accessToken);

    const uploadUrlRes = await request(app.getHttpServer())
      .post("/profiles/me/photos/upload-url")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ contentType: "image/jpeg" });
    const { uploadUrl, storageKey } = uploadUrlRes.body;

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: Buffer.from("owner-uploaded-bytes"),
    });

    const attacker = await registerUser(app);
    await createProfile(app, attacker.accessToken);

    const hijackRes = await request(app.getHttpServer())
      .post("/profiles/me/photos")
      .set("Authorization", `Bearer ${attacker.accessToken}`)
      .send({ storageKey, isPrimary: true });
    expect(hijackRes.status).toBe(403);

    // The owner's own photo is still registerable with their own real key — confirms the
    // check is ownership-scoped, not a blanket rejection of already-uploaded objects.
    const ownRegisterRes = await request(app.getHttpServer())
      .post("/profiles/me/photos")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ storageKey, isPrimary: true });
    expect(ownRegisterRes.status).toBe(201);
  });

  it("rejects registering a photo whose storageKey was never actually uploaded", async () => {
    const user = await registerUser(app);
    await createProfile(app, user.accessToken);

    const res = await request(app.getHttpServer())
      .post("/profiles/me/photos")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ storageKey: `photos/${user.id}/never-uploaded.jpg` });
    expect(res.status).toBe(400);
  });

  it("rejects an unsupported content type when requesting an upload URL", async () => {
    const user = await registerUser(app);
    const res = await request(app.getHttpServer())
      .post("/profiles/me/photos/upload-url")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ contentType: "application/pdf" });
    expect(res.status).toBe(400);
  });
});
