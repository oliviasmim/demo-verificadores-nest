import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { toPublicUser, type PublicUser } from '../users/public-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return toPublicUser(await this.authService.register(dto));
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(dto);
  }
}
