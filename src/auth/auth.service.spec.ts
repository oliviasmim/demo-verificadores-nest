import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const ana = { name: 'Ana', email: 'ana@pda.org', password: 'senha12345' };

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'segredo-de-teste' });
    service = new AuthService(
      new UsersService(new UsersRepository()),
      jwtService,
    );
  });

  it('login retorna token', async () => {
    const authService = {
      login: () => Promise.resolve({ access_token: 'token-falso' }),
    };

    const resultado = await authService.login();

    expect(resultado.access_token).toBe('token-falso');
  });

  it('registra o usuário e devolve os dados cadastrados', async () => {
    const user = await service.register(ana);

    expect(user.email).toBe('ana@pda.org');
    expect(user.name).toBe('Ana');
  });

  it('emite um token cujo conteúdo identifica o usuário', async () => {
    const user = await service.register(ana);

    const { access_token } = await service.login({
      email: ana.email,
      password: ana.password,
    });

    const payload = await jwtService.verifyAsync<{
      sub: string;
      email: string;
    }>(access_token);
    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe('ana@pda.org');
  });

  it('recusa senha errada com mensagem genérica', async () => {
    await service.register(ana);

    await expect(
      service.login({ email: ana.email, password: 'errada-errada' }),
    ).rejects.toThrow(new UnauthorizedException('Credenciais inválidas'));
  });

  it('recusa e-mail inexistente com a mesma mensagem genérica', async () => {
    await expect(
      service.login({ email: 'ninguem@pda.org', password: 'senha12345' }),
    ).rejects.toThrow(new UnauthorizedException('Credenciais inválidas'));
  });
});
