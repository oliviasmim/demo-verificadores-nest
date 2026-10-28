# AGENTS.md

API NestJS 11 de usuários com login JWT (bcryptjs), repositório em memória e
testes com Jest. Repositório demo da aula "Verificadores": o "pronto" vem de
sensores (lint, tipos, build, testes, cobertura, audit), não da palavra de
quem escreveu. A spec (EARS + BDD) está em `docs/specs/`; ela descreve
cenários ainda **pendentes** de teste.

## Comandos

```bash
npm ci                 # instalar dependências (reprodutível)
npm run start:dev      # API em http://localhost:3000 (JWT_SECRET opcional)
npm run lint           # ESLint, SEM --fix (lint:fix só local)
npm run typecheck      # tsc --noEmit (src e test)
npm run build          # nest build
npm test               # Jest: unit + e2e + bdd
npm run test:cov       # Jest com cobertura (piso global de 80%)
npm run audit          # npm audit --audit-level=high
npm run verify         # lint + typecheck + build + test:cov + audit (igual ao CI)
```

## Mapa de pastas

```
src/auth/     registro, login, JwtStrategy, JwtAuthGuard, jwt.config
src/users/    entidade, repositório em memória, service, controller, DTOs
src/app.setup.ts   configureApp (ValidationPipe), usado no main e nos e2e
test/         e2e (supertest) | test/bdd/ um arquivo por cenário | test/helpers/criar-app.ts
docs/         ARQUITETURA, TESTES, VERIFICADORES, SEGURANCA, adr/, specs/
.agents/      skills, agents e hooks (agnóstico de ferramenta); .claude/ só faz a ponte
```

## Convenções

- Nest: `module` / `controller` / `service` / `dto` / `repository` por recurso;
  controller só traduz HTTP, regra fica no service, dados no repositório.
- DTOs com `class-validator`; o `ValidationPipe` global vem de `configureApp`.
- Nunca devolver entidade com `passwordHash` (nem `password`) numa resposta.
- Erros com exceções HTTP do Nest (`NotFoundException`, `UnauthorizedException`...).
- Usuário logado: `req.user` (`AuthenticatedRequest`), nunca o corpo da requisição.
- Testes e nomes de domínio em português do Brasil; asserts com valor exato.
- Um app novo por teste e2e (`criarApp()`): sem estado compartilhado.

## Definição de pronto

Só está pronto quando:

1. `npm run verify` termina **verde**, e
2. existe um **teste do comportamento**, escrito **antes** da implementação.

Mostre a saída dos comandos (contagem de testes, cobertura, audit). Não
afirme "passou" sem ter rodado e lido a saída. Se algo falhou, diga o que falhou.

## Fluxo para comportamento novo (BDD, red, green, refactor)

1. Parta de um `Cenário:` em `docs/specs/features/*.feature`.
2. **RED:** teste em `test/bdd/<slug>.e2e-spec.ts` (nome = frase do cenário);
   rode e confirme que falha pelo motivo do cenário. Commit só do teste.
3. **GREEN:** o mínimo em `src/` para passar. Commit separado.
4. **REFACTOR** (opcional) com testes verdes. Commit separado.
5. Registre as saídas reais em `LOG-RED-GREEN-REFACTOR-<n>.md`.

Commits em português, conventional commits (`test:`, `feat:`, `fix:`, `refactor:`, `docs:`).

## NUNCA

- baixar `coverageThreshold` ou excluir arquivos da cobertura para passar;
- adicionar `.skip`, `.only`, `xit`, `xdescribe`;
- usar `--no-verify`, `git push --force` ou push direto na `main` (abra um PR);
- `eslint-disable` sem justificativa escrita ao lado;
- `npm audit fix --force`;
- instalar pacote sem confirmar que existe no npm e é o certo (slopsquatting:
  nomes plausíveis inventados por IA podem ser pacotes maliciosos);
- editar um teste para "ficar verde" mudando o valor esperado, sem pedido explícito;
- commitar segredo ou ler `.env`.

## Ponteiros

- Docs: `docs/README.md` (arquitetura, testes, verificadores, segurança, ADRs).
- Skills (`.agents/skills/`): `nestjs-recurso`, `nestjs-auth-jwt`, `nestjs-testes`,
  `bdd-para-teste`, `caca-teste-inutil`, `verificar-antes-de-pronto`.
- Agents (`.agents/agents/`): `revisor-de-seguranca`, `cetico-de-testes`, `tradutor-bdd`.
- Hooks (`.agents/hooks/`, ativos no Claude Code): ver `.agents/README.md`.
