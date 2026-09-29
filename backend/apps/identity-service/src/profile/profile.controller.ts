import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";

import { AccessTokenGuard } from "../auth/access-token.guard";
import type { RequestWithUser } from "../auth/auth.types";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("users")
@UseGuards(AccessTokenGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) { }

  @Get("me")
  getCurrentUser(@Req() request: RequestWithUser) {
    return this.profiles.getCurrentUser(request.user.sub);
  }

  @Patch("me")
  updateProfile(
    @Req() request: RequestWithUser,
    @Body() input: UpdateProfileDto,
  ) {
    return this.profiles.updateProfile(request.user.sub, input);
  }
}