import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { paginate, type PaginatedResult } from "../common/dto/pagination-query.dto";
import type { ListUsersQueryDto } from "./dto/list-users-query.dto";

export interface UserRecord {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  createdAt: Date;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserRecord> {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException("User not found");
    }

    return toUserRecord(user);
  }

  async list(query: ListUsersQueryDto): Promise<PaginatedResult<UserRecord>> {
    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.email ? { email: { contains: query.email, mode: "insensitive" as const } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where,
        select: userSelect,
        orderBy: { [query.sortBy]: query.sortDir },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.users.count({ where }),
    ]);

    return paginate(rows.map(toUserRecord), total, query);
  }
}

// Explicit select — never rely on Prisma's "return all scalar fields by default"
// behavior for a model that includes passwordHash. This is the enforcement point that
// guarantees the hash can never leak into a response, not just a convention to remember.
const userSelect = {
  id: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  deletedAt: true,
  roles: { select: { role: { select: { key: true } } } },
} as const;

function toUserRecord(user: {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  roles: { role: { key: string } }[];
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    roles: user.roles.map((r) => r.role.key),
    createdAt: user.createdAt,
    emailVerifiedAt: user.emailVerifiedAt,
    phoneVerifiedAt: user.phoneVerifiedAt,
  };
}
