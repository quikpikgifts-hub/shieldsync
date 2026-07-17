import { Injectable } from "@nestjs/common";
import { IntegrationNotConfiguredError } from "../integration-not-configured.error";
import type { PresignedUpload, StorageProvider } from "./storage-provider.interface";

@Injectable()
export class NotConfiguredStorageProvider implements StorageProvider {
  createPresignedUpload(_ownerId: string, _contentType: string): Promise<PresignedUpload> {
    throw new IntegrationNotConfiguredError("AWS S3", "AWS_REGION / AWS_S3_BUCKET");
  }

  deleteObject(_storageKey: string): Promise<void> {
    throw new IntegrationNotConfiguredError("AWS S3", "AWS_REGION / AWS_S3_BUCKET");
  }

  getReadUrl(_storageKey: string): Promise<string> {
    throw new IntegrationNotConfiguredError("AWS S3", "AWS_REGION / AWS_S3_BUCKET");
  }
}
