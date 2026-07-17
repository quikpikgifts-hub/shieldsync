import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import type { AppConfig } from "../../config/configuration";
import type { ObjectMetadata, PresignedUpload, StorageProvider } from "./storage-provider.interface";

const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const READ_URL_TTL_SECONDS = 15 * 60;

// Secure-uploads allowlist: the presigned PUT is scoped to a specific Content-Type via
// the signature itself (S3 rejects a PUT whose actual Content-Type header doesn't match
// what was signed), and only these types are ever signed — an attacker can't smuggle an
// executable or HTML file (a classic stored-XSS-via-uploaded-file vector) through this
// endpoint regardless of what extension they claim.
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Real S3-compatible object storage adapter — also works against MinIO/S3-compatible test doubles via S3_ENDPOINT + S3_FORCE_PATH_STYLE. */
@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    const storageConfig = configService.getOrThrow<AppConfig["storage"]>("app.storage");
    if (!storageConfig.bucket) {
      throw new Error("S3StorageProvider constructed without S3_BUCKET — this indicates a wiring bug in IntegrationsModule.");
    }

    this.bucket = storageConfig.bucket;
    this.client = new S3Client({
      region: storageConfig.region,
      endpoint: storageConfig.endpoint ?? undefined,
      forcePathStyle: storageConfig.forcePathStyle,
      credentials:
        storageConfig.accessKeyId && storageConfig.secretAccessKey
          ? { accessKeyId: storageConfig.accessKeyId, secretAccessKey: storageConfig.secretAccessKey }
          : undefined,
    });
  }

  async createPresignedUpload(ownerId: string, contentType: string): Promise<PresignedUpload> {
    const extension = ALLOWED_CONTENT_TYPES[contentType];
    if (!extension) {
      throw new Error(
        `Unsupported content type "${contentType}" — only ${Object.keys(ALLOWED_CONTENT_TYPES).join(", ")} are accepted.`,
      );
    }

    // Namespaced by owner so a leaked/guessed key from one user's upload can't be used to
    // enumerate another user's photo keys by pattern-matching a shared prefix.
    const storageKey = `photos/${ownerId}/${randomUUID()}.${extension}`;

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: contentType }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );

    return { uploadUrl, storageKey, expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000) };
  }

  async getReadUrl(storageKey: string): Promise<string> {
    // Never a permanent public URL, even if S3_PUBLIC_BASE_URL happens to be configured
    // for a CDN in front of the bucket — photos are moderated before they're meant to be
    // visible to anyone but the owner, so every read goes through a short-lived signed URL
    // rather than a guessable static path.
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }), {
      expiresIn: READ_URL_TTL_SECONDS,
    });
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }

  async headObject(storageKey: string): Promise<ObjectMetadata | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }));
      return { contentType: result.ContentType ?? null, byteSizeBytes: result.ContentLength ?? 0 };
    } catch (error) {
      if (error instanceof NotFound) return null;
      throw error;
    }
  }

  async getObjectBuffer(storageKey: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error(`Object "${storageKey}" returned no body`);
    }
    return Buffer.from(bytes);
  }

  async putObject(storageKey: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, Body: body, ContentType: contentType }),
    );
  }
}
