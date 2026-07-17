import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { STORAGE_PROVIDER, type StorageProvider } from "../integrations/storage/storage-provider.interface";
import { ThumbnailService } from "./thumbnail.service";
import type { UpsertProfileDto } from "./dto/upsert-profile.dto";
import type { UpsertPreferencesDto } from "./dto/upsert-preferences.dto";
import type { AddPhotoDto } from "./dto/add-photo.dto";
import type { CreatePhotoUploadUrlDto } from "./dto/create-photo-upload-url.dto";
import type { UpsertPromptAnswersDto } from "./dto/upsert-prompt-answers.dto";
import { PhotoModerationStatus } from "@prisma/client";
import type { AppConfig } from "../config/configuration";
import type { PresignedUpload } from "../integrations/storage/storage-provider.interface";

@Injectable()
export class ProfilesService {
  private readonly storageEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
    private readonly thumbnailService: ThumbnailService,
    configService: ConfigService,
  ) {
    this.storageEnabled = configService.getOrThrow<AppConfig["storage"]>("app.storage").enabled;
  }

  async createPhotoUploadUrl(userId: string, dto: CreatePhotoUploadUrlDto): Promise<PresignedUpload> {
    return this.storageProvider.createPresignedUpload(userId, dto.contentType);
  }

  async getOwn(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { photos: true, promptAnswers: true },
    });
    if (!profile) return null; // null is a valid response — the client hasn't created a profile yet
    return { ...profile, photos: await this.hydratePhotoUrls(profile.photos) };
  }

  async upsert(userId: string, dto: UpsertProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.preferences.findUnique({ where: { userId } });
  }

  async upsertPromptAnswers(userId: string, dto: UpsertPromptAnswersDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new BadRequestException("Create a profile before answering prompts.");
    }

    return this.prisma.$transaction(
      dto.answers.map((entry) =>
        this.prisma.promptAnswer.upsert({
          where: { profileId_promptKey: { profileId: userId, promptKey: entry.promptKey } },
          update: { answer: entry.answer },
          create: { profileId: userId, promptKey: entry.promptKey, answer: entry.answer },
        }),
      ),
    );
  }

  async upsertPreferences(userId: string, dto: UpsertPreferencesDto) {
    const ageMin = dto.ageMin;
    const ageMax = dto.ageMax;
    if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) {
      throw new BadRequestException("ageMin cannot be greater than ageMax");
    }

    return this.prisma.preferences.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  async addPhoto(userId: string, dto: AddPhotoDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new BadRequestException("Create a profile before adding photos.");
    }

    // Only validated against real storage when a real StorageProvider is configured — see
    // OPEN_DECISIONS.md D-05's original note that storageKey was historically just a
    // client-supplied string with nothing behind it. When storage IS configured, this
    // closes that gap: the client must have actually uploaded something to the presigned
    // URL before the photo can be registered, and real metadata (content type, byte size)
    // is captured from the object itself rather than trusted from the client.
    let metadata: { contentType: string | null; byteSizeBytes: number } | null = null;
    if (this.storageEnabled) {
      metadata = await this.storageProvider.headObject(dto.storageKey);
      if (!metadata) {
        throw new BadRequestException(
          "No uploaded object found for this storageKey — upload to the presigned URL before registering the photo.",
        );
      }
    }

    // Clearing the old primary flag and creating the new one in one transaction closes
    // the race window that used to exist between those two separate statements
    // (SECURITY_AUDIT.md L-3) — and the database's own partial unique index
    // (`photos_one_primary_per_profile`, migration 20260717133717) is the final backstop
    // even if this code is ever called from two places that aren't both transactional.
    const photo = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.photo.updateMany({ where: { profileId: userId }, data: { isPrimary: false } });
      }

      // New photos always start PENDING regardless of what the client sends —
      // moderation status is not client-settable, only moderator/admin-settable via
      // setModerationStatus.
      return tx.photo.create({
        data: {
          profileId: userId,
          storageKey: dto.storageKey,
          isPrimary: dto.isPrimary ?? false,
          blurredUntilMatch: dto.blurredUntilMatch ?? false,
          moderationStatus: PhotoModerationStatus.PENDING,
          contentType: metadata?.contentType ?? null,
          byteSizeBytes: metadata?.byteSizeBytes ?? null,
        },
      });
    });

    if (this.storageEnabled) {
      await this.thumbnailService.enqueue(photo.id, photo.storageKey);
    }

    return photo;
  }

  async removePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.profileId !== userId) {
      throw new NotFoundException("Photo not found");
    }
    await this.prisma.photo.delete({ where: { id: photoId } });

    if (this.storageEnabled) {
      // Best-effort — an orphaned object in storage is a cleanup/cost issue, not a
      // correctness one, so it shouldn't turn a successful delete into a failed request.
      await this.storageProvider.deleteObject(photo.storageKey).catch(() => undefined);
      if (photo.thumbnailStorageKey) {
        await this.storageProvider.deleteObject(photo.thumbnailStorageKey).catch(() => undefined);
      }
    }
  }

  async setModerationStatus(photoId: string, status: PhotoModerationStatus) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException("Photo not found");
    }
    return this.prisma.photo.update({ where: { id: photoId }, data: { moderationStatus: status } });
  }

  /**
   * Public-facing profile view for another user. Returns null (mapped to 404 by the
   * caller) rather than a 403 when blocked, so a viewer can't distinguish "blocked" from
   * "doesn't exist" — telling a blocker's target that they've been blocked is itself an
   * information leak worth avoiding.
   */
  async getPublicProfile(viewerId: string, targetUserId: string) {
    if (viewerId === targetUserId) {
      throw new ForbiddenException("Use GET /profiles/me for your own profile.");
    }

    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: viewerId },
        ],
      },
    });
    if (blocked) {
      return null;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: {
        photos: { where: { moderationStatus: PhotoModerationStatus.APPROVED } },
        promptAnswers: true,
      },
    });

    if (!profile || !profile.visible || profile.deletedAt) {
      return null;
    }

    return { ...profile, photos: await this.hydratePhotoUrls(profile.photos) };
  }

  /**
   * Never a permanent public URL, even for approved photos — every read is a short-lived
   * signed URL freshly issued per request (see S3StorageProvider.getReadUrl's doc
   * comment). Falls back to returning the raw storageKey (unusable directly by a client,
   * but the historical pre-Phase-3 behavior) when storage isn't configured, so this
   * doesn't error out in local dev/CI without S3 set up.
   */
  private async hydratePhotoUrls<T extends { storageKey: string; thumbnailStorageKey: string | null }>(
    photos: T[],
  ): Promise<(T & { url: string; thumbnailUrl: string | null })[]> {
    return Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        url: this.storageEnabled ? await this.storageProvider.getReadUrl(photo.storageKey) : photo.storageKey,
        thumbnailUrl:
          this.storageEnabled && photo.thumbnailStorageKey
            ? await this.storageProvider.getReadUrl(photo.thumbnailStorageKey)
            : null,
      })),
    );
  }
}
