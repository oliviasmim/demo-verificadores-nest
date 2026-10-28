# Demo Verificadores — API de usuários e autenticação (NestJS)

Projeto de demonstração da aula **Verificadores** (semana 8). É uma API pequena
de cadastro, login (JWT) e CRUD de usuários, montada para mostrar na prática
como lint, tipos, build, testes, cobertura e auditoria de dependências
funcionam como **sensores** que dizem se o código está pronto, sem depender
da palavra de quem escreveu.

A especificação (requisitos EARS e cenários BDD) está em
[`docs/specs/`](./docs/specs/). Há **cenários pendentes** descritos na spec,
que ainda não viraram teste: eles são o material do exercício da aula.

## Como rodar

Requisitos: Node 22 ou mais novo (o CI usa Node 22; localmente também roda em versões mais novas).

```bash
npm ci
npm run start:dev      # http://localhost:3000
```

Variáveis (opcional, ver `.env.example`): `JWT_SECRET` e `PORT`. Sem
`JWT_SECRET` o app usa um segredo fixo de desenvolvimento, que **não deve** ir
para produção. O app não lê o arquivo `.env` sozinho; exporte a variável:

```bash
JWT_SECRET=um-segredo-longo npm run start:dev
```

### Rotas

| Método | Rota | Auth | Resposta |
|---|---|---|---|
| POST | `/auth/register` | não | 201 com o usuário |
| POST | `/auth/login` | não | 200 `{ "access_token": "..." }` ou 401 `Credenciais inválidas` |
| GET | `/users` | JWT | lista |
| GET | `/users/me` | JWT | usuário logado |
| GET | `/users/:id` | JWT | 200 ou 404 |
| PATCH | `/users/:id` | JWT | usuário atualizado (`name`, `email`, `password`) |
| DELETE | `/users/:id` | JWT | 204 |

Sem token, todas as rotas de `/users` respondem 401.

## Scripts e o que cada sensor pega

| Script | O que faz | O que pega |
|---|---|---|
| `npm run lint` | ESLint (flat config) **sem** `--fix` | estilo, bugs comuns, promessas esquecidas |
| `npm run lint:fix` | ESLint com `--fix` | só para uso local: corrige o que dá |
| `npm run typecheck` | `tsc --noEmit` em `src` e `test` | erros de tipo, inclusive nos testes |
| `npm run build` | `nest build` | código que não compila/empacota |
| `npm test` | Jest: unit (`src/**/*.spec.ts`) + e2e (`test/**/*.e2e-spec.ts`) | regressão de comportamento |
| `npm run test:cov` | Jest com cobertura, piso global de 80% | código que nenhum teste executa |
| `npm run audit` | `npm audit --audit-level=high` | dependência com vulnerabilidade conhecida (high/critical) |
| `npm run verify` | todos acima em sequência | o "pronto" completo, igual ao CI |
| `npm run agents:test-hooks` | testa os hooks do setup de IA | hook que deixou de bloquear |
| `npm run agents:sync` | copia `.agents/` para `.claude/` sem symlink | (Windows) agentes invisíveis |
| `npm start` / `start:dev` | sobe a API | (não é sensor) |

O CI (`.github/workflows/ci.yml`) roda os mesmos sensores em jobs separados e
publica o relatório de cobertura como artifact.

## Postman

Em [`postman/`](./postman/):

1. Importe `demo-verificadores.postman_collection.json` e `local.postman_environment.json`.
2. Selecione o ambiente **Local** (`baseUrl = http://localhost:3000`).
3. **Reinicie o servidor** (os dados ficam em memória) e rode a coleção na ordem:
   `0. Setup` (cadastra e loga Ana e Bruno, guarda tokens e ids),
   `1. Auth`, `2. Usuários (CRUD)` e `3. Cenários BDD`.

A pasta `3. Cenários BDD` tem uma subpasta por cenário pendente da spec, com
`pm.test` nomeados com a frase do cenário e verificando o comportamento
**esperado**. Enquanto o cenário não for implementado, esses testes falham, e é
isso que a pasta serve para mostrar. Rode-a por último: o cenário de apagar
conta altera dados.

Pela linha de comando:
`npx newman run postman/demo-verificadores.postman_collection.json -e postman/local.postman_environment.json`.

## Estrutura

```
src/
  app.setup.ts        configuração compartilhada (ValidationPipe) usada no main e nos testes e2e
  auth/               registro, login, JwtStrategy, JwtAuthGuard
  users/              entidade, repositório em memória, service, controller
test/                 e2e com supertest contra o AppModule real
test/bdd/             testes dos cenários BDD pendentes (um arquivo por cenário)
docs/specs/           spec em Markdown e arquivos .feature
postman/              coleção e ambiente
AGENTS.md             instruções para agentes (CLAUDE.md importa este)
.agents/              skills, agents e hooks; .claude/ aponta para cá
```

## Setup de IA

- [`AGENTS.md`](./AGENTS.md): instruções do projeto para qualquer agente (comandos, convenções, definição de pronto, o que nunca fazer).
- [`.agents/README.md`](./.agents/README.md): skills, subagentes e hooks.
- [`docs/`](./docs/README.md): arquitetura, testes, verificadores, segurança e ADRs.

Por que assim: o `AGENTS.md` é um padrão aberto, lido por várias ferramentas
(Claude Code, Codex, Cursor), então é a fonte única; o `CLAUDE.md` só o
importa. A pasta `.agents/` guarda skills, agentes e hooks sem amarrar a
ferramenta, e `.claude/` apenas faz a ponte (symlinks e `settings.json`). Os
**hooks** são verificadores determinísticos: bloqueiam `--no-verify`, `.skip`,
queda de cobertura e "pronto" sem lint/tipos/testes verdes, e o agente não
consegue "esquecer" deles, ao contrário de uma instrução escrita no
`AGENTS.md`. Teste-os com `npm run agents:test-hooks`.

## Por que essas escolhas

- **NestJS 11:** estrutura (módulos, injeção de dependência, guards) que
  facilita testar cada peça isolada e o app inteiro. Usamos a linha 11 porque
  ela é CommonJS e funciona com Jest e ESLint sem configuração extra; a linha
  12 migrou para ESM, vitest e oxlint, e `@nestjs/jwt` e `@nestjs/passport`
  acompanham a mesma versão maior.
- **JWT (`@nestjs/jwt` + `passport-jwt`):** autenticação sem sessão no
  servidor, simples de exercitar com curl/Postman. Expira em 1 hora.
- **`bcryptjs`:** hash de senha em JavaScript puro, sem módulo nativo, então
  não quebra o `npm ci` em outra versão de Node ou no CI.
- **Repositório em memória:** o foco da aula são os verificadores, não a
  persistência. O estado vive na instância de `UsersRepository` (nunca em
  variável de módulo), então cada teste e2e que cria um app novo começa
  limpo. Trocar por TypeORM ou Prisma depois mexe só nessa classe.
- **`lint` sem `--fix`:** no CI, `--fix` corrige o arquivo no runner e o job
  passa, escondendo o problema que continua no código commitado. Sensor tem que
  reportar, não consertar. O `lint:fix` existe só para uso local.
- **Threshold de cobertura de 80%:** transforma "tem testes?" em um portão
  automático. Ele é um piso: mede quais linhas executaram, não se os testes
  verificam algo útil.
- **`npm audit --audit-level=high`:** bloqueia high/critical; moderate e low
  aparecem no relatório sem derrubar o job.

## Auditoria de dependências (registro)

- O `npm audit` apontou **high** no `multer` 2.4.0, dependência transitiva do
  `@nestjs/platform-express` 11.2.8 (DoS, GHSA-q7qp-rjg7-q26m), corrigido na
  2.5.0. Resolvido com `overrides` no `package.json` (`"multer": "^2.5.0"`).
  Quando o Nest publicar uma versão que já use multer 2.5 ou mais novo, o
  override pode sair.
- Restam **8 vulnerabilidades low** em dependências de desenvolvimento
  (`deepmerge` via `jest-config` e `@nestjs/cli`). Não bloqueiam o CI e não
  vão para produção; a correção automática exigiria um downgrade do
  `@nestjs/cli`, então ficam documentadas aqui.
