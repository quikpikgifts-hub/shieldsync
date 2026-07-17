import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type { ObjectMetadata, PresignedUpload, StorageProvider } from "./storage-provider.interface";

const HINT = "S3_BUCKET / S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY";

@Injectable()
export class NotConfiguredStorageProvider implements StorageProvider {
  createPresignedUpload(_ownerId: string, _contentType: string): Promise<PresignedUpload> {
    throw new IntegrationNotConfiguredError("Object storage", HINT);
  }

  deleteObject(_storageKey: string): Promise<void> {
    throw new IntegrationNotConfiguredError("Object storage", HINT);
  }

  getReadUrl(_storageKey: string): Promise<string> {
    throw new IntegrationNotConfiguredError("Object storage", HINT);
  }

  headObject(_storageKey: string): Promise<ObjectMetadata | null> {
    throw new IntegrationNotConfiguredError("Object storage", HINT);
  }

  getObjectBuffer(_storageKey: string): Promise<Buffer> {
    throw new IntegrationNotConfiguredError("Object storage", HINT);
  }

  putObject(_storageKey: string, _body: Buffer, _contentType: string): Promise<void> {
    throw new IntegrationNotConfiguredError("Object storage", HINT);
  }
}
