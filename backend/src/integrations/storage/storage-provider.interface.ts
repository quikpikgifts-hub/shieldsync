export const STORAGE_PROVIDER = Symbol("STORAGE_PROVIDER");

export interface PresignedUpload {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
}

export interface ObjectMetadata {
  contentType: string | null;
  byteSizeBytes: number;
}

/** Contract a real S3 (or equivalent) adapter must implement for photo/voice/video storage. */
export interface StorageProvider {
  /** A time-boxed, client-writable URL — the client PUTs bytes directly to storage, never through this API. */
  createPresignedUpload(ownerId: string, contentType: string): Promise<PresignedUpload>;
  /** A time-boxed, read-only URL for retrieving a private object — never a permanent public link. */
  getReadUrl(storageKey: string): Promise<string>;
  deleteObject(storageKey: string): Promise<void>;
  headObject(storageKey: string): Promise<ObjectMetadata | null>;
  /** Server-side read of the full object — used only for the thumbnail-generation pipeline, never exposed directly to a client. */
  getObjectBuffer(storageKey: string): Promise<Buffer>;
  /** Server-side write — used only for pipeline-generated derivatives (thumbnails), never for a client's original upload (that always goes through the presigned URL). */
  putObject(storageKey: string, body: Buffer, contentType: string): Promise<void>;
}
