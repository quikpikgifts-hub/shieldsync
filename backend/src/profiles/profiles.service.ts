import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { UpsertProfileDto } from "./dto/upsert-profile.dto";
import type { UpsertPreferencesDto } from "./dto/upsert-preferences.dto";
import type { AddPhotoDto } from "./dto/add-photo.dto";
import { PhotoModerationStatus } from "@prisma/client";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwn(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { photos: true, promptAnswers: true },
    });
    return profile; // null is a valid response — the client hasn't created a profile yet
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

    if (dto.isPrimary) {
      await this.prisma.photo.updateMany({ where: { profileId: userId }, data: { isPrimary: false } });
    }

    // New photos always start PENDING regardless of what the client sends — moderation
    // status is not client-settable, only moderator/admin-settable via setModerationStatus.
    return this.prisma.photo.create({
      data: {
        profileId: userId,
        storageKey: dto.storageKey,
        isPrimary: dto.isPrimary ?? false,
        blurredUntilMatch: dto.blurredUntilMatch ?? false,
        moderationStatus: PhotoModerationStatus.PENDING,
      },
    });
  }

  async removePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.profileId !== userId) {
      throw new NotFoundException("Photo not found");
    }
    await this.prisma.photo.delete({ where: { id: photoId } });
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

    return profile;
  }
}
