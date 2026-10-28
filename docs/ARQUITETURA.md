# Arquitetura

API REST em NestJS 11 (CommonJS) com dois módulos de domínio e persistência
em memória. O comportamento esperado está em [`specs/`](./specs/).

## Módulos

```
AppModule
├── UsersModule   src/users/   entidade, repositório, service, controller (/users)
└── AuthModule    src/auth/    registro, login, JwtStrategy, JwtAuthGuard (/auth)
```

- `AuthModule` importa `UsersModule` (usa o `UsersService`, exportado por ele).
- `UsersController` usa o `JwtAuthGuard` do `AuthModule` em nível de classe.
- `src/app.setup.ts` exporta `configureApp(app)` (o `ValidationPipe` com
  `whitelist`, `forbidNonWhitelisted` e `transform`). É chamado no `main.ts`
  **e** nos testes e2e (via `test/helpers/criar-app.ts`), para o teste validar
  entrada exatamente como o app real.

## Fluxo de uma requisição

```
HTTP -> ValidationPipe (DTO) -> JwtAuthGuard -> Controller -> Service -> Repositório
                                     |                                     (memória)
                                     +-> JwtStrategy.validate() coloca { id, email } em req.user
```

1. **ValidationPipe** valida o corpo contra o DTO (`class-validator`). Falha vira 400.
2. **JwtAuthGuard** (`AuthGuard('jwt')`) exige `Authorization: Bearer <token>` nas
   rotas protegidas. Sem token válido: 401. A `JwtStrategy` valida a assinatura e a
   expiração e devolve `{ id, email }` (o `sub` do token), que vira `req.user`.
3. **Controller** só traduz HTTP: lê parâmetros/corpo/`req.user` e chama o service.
4. **Service** concentra a regra de negócio (hash de senha, exceções HTTP do Nest
   como `NotFoundException`/`UnauthorizedException`).
5. **Repositório** guarda e busca dados. Não conhece HTTP.

`/auth/register` e `/auth/login` não passam pelo guard.

## Onde fica cada coisa

| Preciso de... | Arquivo |
|---|---|
| Rota nova de usuário | `src/users/users.controller.ts` (+ método no `users.service.ts`) |
| Regra de negócio de usuário | `src/users/users.service.ts` |
| Acesso a dados | `src/users/users.repository.ts` |
| Validação de entrada | `src/*/dto/*.dto.ts` |
| Segredo e expiração do JWT | `src/auth/jwt.config.ts` |
| Tipo do usuário logado (`req.user`) | `src/auth/authenticated-request.ts` |
| Pipe/config compartilhada | `src/app.setup.ts` |
| Subir o app | `src/main.ts` |

## Como trocar o repositório em memória por um banco

O estado vive **na instância** de `UsersRepository` (nunca em variável de
módulo), por isso cada app de teste começa limpo. Para trocar por TypeORM ou
Prisma:

1. Mantenha a mesma interface pública da classe (`insert`, `findAll`, `findById`,
   `findByEmail`, `update`, `delete`). Se virar assíncrona, os métodos passam a
   devolver `Promise` e o `UsersService` ganha `await`: essa é a parte que mais
   muda (hoje vários métodos do service são síncronos).
2. Reescreva só `users.repository.ts` (e registre o módulo do ORM no `UsersModule`).
3. Os testes unitários do repositório (`users.repository.spec.ts`) viram testes
   de integração contra um banco de teste; os e2e continuam valendo como contrato.
4. Atualize o [ADR 0001](./adr/0001-repositorio-em-memoria.md).

Ver também: [`TESTES.md`](./TESTES.md), [`SEGURANCA.md`](./SEGURANCA.md).
