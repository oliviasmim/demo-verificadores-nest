import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  register(dto: RegisterDto): Promise<User> {
    return this.usersService.create(dto);
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const user = this.usersService.findByEmail(dto.email);
    const senhaConfere =
      user !== undefined &&
      (await bcrypt.compare(dto.password, user.passwordHash));

    if (!user || !senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
    return { access_token };
  }
}
