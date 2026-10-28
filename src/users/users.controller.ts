import {
  Body,
  Controller,
  Delete,
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
import { User } from './user.entity';
import { UsersService } from './users.service';

// Nunca devolver o hash da senha: toda resposta com usuário passa por aqui.
function semSenha(user: User): Partial<User> {
  const publico: Partial<User> = { ...user };
  delete publico.passwordHash;
  return publico;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Partial<User>[] {
    return this.usersService.findAll().map(semSenha);
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest): Partial<User> {
    return semSenha(this.usersService.findOne(req.user.id));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Partial<User> {
    return semSenha(this.usersService.findOne(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<Partial<User>> {
    return semSenha(await this.usersService.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.usersService.remove(id);
  }
}
