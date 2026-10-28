---
name: nestjs-auth-jwt
description: Mexe em autenticação e autorização neste projeto NestJS (JwtStrategy, JwtAuthGuard, req.user, checagem de dono, hash bcryptjs, mensagens de erro de login). Use quando o pedido envolver login, token, proteger rota, "só o dono pode", hash de senha ou o que a API devolve sobre o usuário.
allowed-tools: Read, Edit, Grep, Glob, Bash(npm run *), Bash(npx jest *), Bash(npx eslint *)
---

# Autenticação e autorização (JWT) neste repo

## O que ela faz

Orienta qualquer mudança em auth sem quebrar as regras de
[`docs/SEGURANCA.md`](../../../docs/SEGURANCA.md): como o token é emitido e
validado, como pegar o usuário logado, como checar o dono do recurso, como
guardar senha e que mensagens devolver.

## Quando ela dispara (e quando não deveria)

- Dispara: "só o dono pode editar a tarefa", "adicione a rota X protegida",
  "troque a expiração do token", "o login devolve o quê?".
- Não dispara: "formate o preço" ou "crie o recurso X" sem requisito de dono (use `nestjs-recurso`).

## Como funciona aqui

- **Emissão:** `AuthService.login` valida e-mail e senha e assina
  `{ sub: user.id, email }` com `JwtService` (`JWT_EXPIRES_IN = '1h'`).
- **Segredo:** `getJwtSecret()` em `src/auth/jwt.config.ts` lê `process.env.JWT_SECRET`;
  o fallback fixo é só de desenvolvimento. Nunca escreva segredo no código.
- **Validação:** `JwtStrategy` (passport-jwt, `fromAuthHeaderAsBearerToken`,
  `ignoreExpiration: false`) devolve `{ id, email }` do payload, que o Nest
  coloca em `req.user`.
- **Guard:** `JwtAuthGuard extends AuthGuard('jwt')`. Use `@UseGuards(JwtAuthGuard)`
  na classe do controller para proteger todas as rotas (como em `UsersController`).
- **Usuário logado:** `@Req() req: AuthenticatedRequest` e `req.user.id`
  (tipo em `src/auth/authenticated-request.ts`).

## Passos

1. Leia `src/auth/` e `src/users/users.controller.ts` antes de mexer.
2. Escreva o teste do comportamento primeiro (e2e, com dois usuários quando
   envolver dono) e veja falhar.
3. Implemente seguindo as regras abaixo.
4. Rode `npm run verify` e mostre a saída.

### Regras

**Checagem de dono.** Compare o id do token com o recurso; o id do usuário
logado nunca vem do corpo nem da URL.

```ts
import { ForbiddenException } from '@nestjs/common';

@Delete(':id')
@HttpCode(204)
remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): void {
  if (req.user.id !== id) {
    throw new ForbiddenException('Você só pode apagar a sua própria conta');
  }
  this.usersService.remove(id);
}
```

**Hash.** `bcrypt.hash(senha, BCRYPT_ROUNDS)` ao gravar e `bcrypt.compare` ao
conferir (`import * as bcrypt from 'bcryptjs'`). Nunca compare senha com `===`.

**Mensagem genérica.** No login, e-mail inexistente e senha errada devolvem o
mesmo `UnauthorizedException('Credenciais inválidas')`. Não revele qual dos dois errou.

**Nunca expor hash.** Respostas devolvem uma visão pública, não a entidade crua:

```ts
export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser({ passwordHash: _omitido, ...publico }: User): PublicUser {
  return publico;
}
```

(Se `_omitido` incomodar o lint, escreva a visão explicitamente:
`{ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }`.)
Teste com ausência: `expect(body).not.toHaveProperty('passwordHash')`.

**Validação de entrada.** DTO novo ganha decoradores de `class-validator`.

## Cuidado com o que a spec ainda não cobre

Checagem de dono no `PATCH /users/:id` ainda não existe (está em "Fora de
escopo" da spec). Se o pedido tocar nisso, trate como comportamento novo: pelo
ciclo da skill `bdd-para-teste`, cenário na spec e teste vermelho antes.

## Exemplo de invocação

```
Só o dono do recurso pode alterá-lo; qualquer outro usuário logado recebe 403.
```

Resultado: teste e2e com dois usuários (403 e 200), checagem no controller/service
e `npm run verify` verde.
