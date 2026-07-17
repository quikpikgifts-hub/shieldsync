export const STORAGE_PROVIDER = Symbol("STORAGE_PROVIDER");

export interface PresignedUpload {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
}

/** Contract a real S3 (or equivalent) adapter must implement for photo/voice/video storage. */
export interface StorageProvider {
  createPresignedUpload(ownerId: string, contentType: string): Promise<PresignedUpload>;
  deleteObject(storageKey: string): Promise<void>;
  getReadUrl(storageKey: string): Promise<string>;
}
