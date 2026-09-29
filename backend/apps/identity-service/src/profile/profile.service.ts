import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import type { AuthUser } from "../auth/auth.types";
import type { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) { }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException("User không tồn tại");
    }

    return this.toPublicUser(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileDto,
  ): Promise<AuthUser> {
    const profileData: {
      displayName?: string;
      phone?: string;
      birthDate?: Date | null;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        throw new BadRequestException("Tên không được để trống");
      }
      profileData.displayName = name;
    }

    if (input.phone !== undefined) {
      profileData.phone = input.phone.trim();
    }

    if (input.birthDate !== undefined) {
      profileData.birthDate = new Date(input.birthDate);
    }

    if (Object.keys(profileData).length === 0) {
      throw new BadRequestException("Không có thông tin cần cập nhật");
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: {
              displayName: profileData.displayName ?? "",
              phone: profileData.phone ?? "",
              birthDate: profileData.birthDate ?? null,
            },
            update: profileData,
          },
        },
      },
      include: { profile: true },
    });

    return this.toPublicUser(user);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    role: AuthUser["role"];
    profile: {
      displayName: string;
      phone: string;
      birthDate: Date | null;
    } | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.profile?.displayName ?? "",
      phone: user.profile?.phone ?? "",
      birthDate: user.profile?.birthDate
        ? user.profile.birthDate.toISOString().slice(0, 10)
        : null,
    };
  }
}