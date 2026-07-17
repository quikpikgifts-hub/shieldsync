import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { ProfilesService } from "./profiles.service";
import { UpsertProfileDto } from "./dto/upsert-profile.dto";
import { UpsertPreferencesDto } from "./dto/upsert-preferences.dto";
import { AddPhotoDto } from "./dto/add-photo.dto";
import { SetPhotoModerationDto } from "./dto/set-photo-moderation.dto";

@ApiTags("profiles")
@ApiBearerAuth()
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get("me")
  @ApiOperation({ summary: "Get the authenticated user's own profile." })
  async getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.getOwn(user.id);
  }

  @Put("me")
  @ApiOperation({ summary: "Create or replace the authenticated user's profile." })
  async upsert(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertProfileDto) {
    return this.profilesService.upsert(user.id, dto);
  }

  @Get("me/preferences")
  @ApiOperation({ summary: "Get the authenticated user's match preferences." })
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.getPreferences(user.id);
  }

  @Put("me/preferences")
  @ApiOperation({ summary: "Create or replace the authenticated user's match preferences." })
  async upsertPreferences(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertPreferencesDto) {
    return this.profilesService.upsertPreferences(user.id, dto);
  }

  @Post("me/photos")
  @ApiOperation({ summary: "Register a photo (already uploaded to storage) on the profile." })
  async addPhoto(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddPhotoDto) {
    return this.profilesService.addPhoto(user.id, dto);
  }

  @Delete("me/photos/:photoId")
  @ApiOperation({ summary: "Remove one of the authenticated user's own photos." })
  async removePhoto(@CurrentUser() user: AuthenticatedUser, @Param("photoId") photoId: string) {
    await this.profilesService.removePhoto(user.id, photoId);
    return { deleted: true };
  }

  @Patch("photos/:photoId/moderation")
  @RequirePermissions("moderation.resolve")
  @ApiOperation({ summary: "Approve or reject a photo (moderator/admin only)." })
  async setModeration(@Param("photoId") photoId: string, @Body() dto: SetPhotoModerationDto) {
    return this.profilesService.setModerationStatus(photoId, dto.status);
  }

  @Get(":userId")
  @ApiOperation({ summary: "View another user's public profile (respects blocks and visibility)." })
  async getPublic(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string) {
    const profile = await this.profilesService.getPublicProfile(user.id, userId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }
}
