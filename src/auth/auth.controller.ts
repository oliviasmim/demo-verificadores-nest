import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Nunca devolver o hash da senha, nem no cadastro.
function semSenha(user: User): Partial<User> {
  const publico: Partial<User> = { ...user };
  delete publico.passwordHash;
  return publico;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<Partial<User>> {
    return semSenha(await this.authService.register(dto));
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(dto);
  }
}
