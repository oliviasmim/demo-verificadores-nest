# Segurança da API

Regras que o código deve respeitar. A coluna **Estado** diz onde cada regra é
verificada (ver [`specs/`](./specs/)).

| # | Regra | Estado |
|---|---|---|
| 1 | Senha só como hash `bcryptjs` (custo 10), nunca em texto puro | em vigor (critério 1 da spec) |
| 2 | Login recusado devolve **sempre** 401 `Credenciais inválidas`, para e-mail inexistente e para senha errada | em vigor (critério 6) |
| 3 | `JWT_SECRET` vem do ambiente; o fallback fixo é só para desenvolvimento local | em vigor (critério 5) |
| 4 | Todas as rotas de `/users` exigem token válido (401 sem ele) | em vigor (critério 4) |
| 5 | Nenhuma resposta inclui `password` nem `passwordHash` | em vigor — `test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts` |
| 6 | Só o dono da conta apaga a própria conta (403 para outra pessoa) | em vigor — `test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts` |
| 7 | Cadastro com e-mail já existente é recusado com 409 | em vigor — `test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts` |
| 8 | `PATCH /users/:id` também deveria recusar edição da conta alheia | candidato a cenário futuro (ver "Fora de escopo" da spec) |

As regras 5, 6 e 7 entraram pelo ciclo BDD (skill `bdd-para-teste`): teste
vermelho primeiro, implementação depois — ver `LOG-RED-GREEN-REFACTOR-{1,2,3}.md`.
A regra 8 é o próximo cenário a seguir o mesmo caminho.

## Detalhes por regra

**Hash de senha.** `bcrypt.hash(senha, 10)` no `UsersService`; comparação com
`bcrypt.compare`. Usamos `bcryptjs` (JS puro, sem módulo nativo) para o
`npm ci` não quebrar entre versões de Node. Nunca registre senha em log.

**Mensagem genérica de login.** Não diga "e-mail não encontrado" nem "senha
incorreta": quem erra recebe a mesma resposta, para a API não servir de
oráculo de contas existentes. Mantenha uma única saída de erro
no `AuthService.login`.

**Checagem de dono.** O id do usuário logado vem de `req.user.id` (o `sub` do
token, tipo `AuthenticatedRequest`), **nunca** do corpo ou da URL. Para agir
sobre `/users/:id`, compare `req.user.id` com `:id` e lance
`ForbiddenException` (403) quando forem diferentes. Sem isso, qualquer
usuário logado age na conta de qualquer outro (IDOR).

**Não expor hash.** Ao devolver usuário, devolva uma visão pública
(`id`, `name`, `email`, `createdAt`), nunca a entidade crua. Teste com
asserção de ausência (`not.toHaveProperty('passwordHash')`).

**`JWT_SECRET`.** Definido via variável de ambiente (ver `.env.example`).
Nunca commite segredo real; `.env` está no `.gitignore` e o Claude Code é
impedido de ler `./.env` (`permissions.deny`).

**Entrada.** DTOs com `class-validator` + `ValidationPipe`
(`whitelist`, `forbidNonWhitelisted`): campos desconhecidos geram 400.

**Dependências.** `npm run audit` bloqueia high/critical. O `multer` (transitivo
do `@nestjs/platform-express`) é fixado em `^2.5.0` via `overrides` no
`package.json` por causa de uma vulnerabilidade de DoS (GHSA-q7qp-rjg7-q26m);
remova o override quando o Nest atualizar. **Nunca** use `npm audit fix --force`.
Antes de instalar um pacote novo, confira que ele existe e é o certo (ver
slopsquatting no [`AGENTS.md`](../AGENTS.md)).

## Checklist de revisão

- [ ] Algum retorno inclui `passwordHash`/`password`?
- [ ] Rotas que alteram dados comparam `req.user.id` com o recurso?
- [ ] Mensagens de erro de login são idênticas nos dois casos?
- [ ] Há segredo hardcoded fora do fallback de desenvolvimento?
- [ ] Todo DTO novo tem decoradores de validação?
- [ ] Dependência nova existe no npm e passa no `npm run audit`?
