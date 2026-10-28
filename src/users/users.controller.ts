import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { UpdateUserDto } from './dto/update-user.dto';
import { toPublicUser, type PublicUser } from './public-user';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): PublicUser[] {
    return this.usersService.findAll().map(toPublicUser);
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest): PublicUser {
    return toPublicUser(this.usersService.findOne(req.user.id));
  }

  @Get(':id')
  findOne(@Param('id') id: string): PublicUser {
    return toPublicUser(this.usersService.findOne(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return toPublicUser(await this.usersService.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): void {
    if (req.user.id !== id) {
      throw new ForbiddenException('Você só pode apagar a sua própria conta');
    }
    this.usersService.remove(id);
  }
}
