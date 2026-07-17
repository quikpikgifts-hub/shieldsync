import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException("You cannot block yourself.");
    }

    const block = await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });

    await this.auditService.record({
      actorId: blockerId,
      action: "block.create",
      subjectId: blockedId,
    });

    return block;
  }

  async listOwn(blockerId: string) {
    return this.prisma.block.findMany({ where: { blockerId }, orderBy: { createdAt: "desc" } });
  }

  async remove(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }

  async isBlocked(userA: string, userB: string): Promise<boolean> {
    const existing = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    return existing !== null;
  }
}
