# Usuários e autenticação — spec

**Bounded context:** Identidade (usuários e acesso)
**Escala:** M
**Fonte da verdade dos cenários:** [`features/`](./features/) (arquivos `.feature`; o texto abaixo é o mesmo)

## Contexto

A API precisa permitir que pessoas se cadastrem, façam login e que apenas
usuários autenticados consultem e gerenciem contas. O foco do projeto é
demonstrar **verificadores** (lint, tipos, build, testes, cobertura, audit),
por isso a persistência é em memória e o escopo é pequeno.

## Decisão

API REST em NestJS com cadastro, login (JWT, expiração de 1h) e CRUD de
usuários protegido por token. Senhas guardadas com hash bcrypt. Entrada
validada na borda (`ValidationPipe` com `whitelist` e `forbidNonWhitelisted`).

## Fora de escopo

- Persistência em banco de dados (o repositório em memória é trocável).
- Refresh token, recuperação de senha, confirmação de e-mail.
- Papéis/permissões além de "dono da própria conta".
- **Próximo cenário (não coberto aqui):** `PATCH /users/:id` também deveria
  recusar (403) a edição da conta de outra pessoa. Fica como candidato a
  cenário seguinte.

## Critérios (EARS)

| # | Padrão | Critério |
|---|---|---|
| 1 | Ubíquo | O sistema deve guardar a senha apenas como hash, nunca em texto puro. |
| 2 | Evento | Quando um cadastro válido é enviado, o sistema deve criar o usuário e responder 201. |
| 3 | Evento | Quando o login é feito com credenciais válidas, o sistema deve devolver um `access_token` com validade de 1 hora. |
| 4 | Estado | Enquanto a requisição não trouxer um token válido, o sistema deve responder 401 em todas as rotas de `/users`. |
| 5 | Opcional | Onde o `JWT_SECRET` estiver definido no ambiente, o sistema deve usá-lo para assinar e validar tokens. |
| 6 | Indesejado | Se o e-mail ou a senha do login estiverem errados, então o sistema deve responder 401 com a mesma mensagem "Credenciais inválidas". |
| 7 | Indesejado | Se o e-mail do cadastro já existir, então o sistema deve recusar com 409. **(implementado, ver cenário abaixo)** |
| 8 | Ubíquo | O sistema não deve incluir `password` nem `passwordHash` em nenhuma resposta. **(implementado, ver cenário abaixo)** |
| 9 | Indesejado | Se um usuário tentar apagar a conta de outra pessoa, então o sistema deve responder 403 e manter a conta. **(implementado, ver cenário abaixo)** |

## Cenários (BDD) — implementados e testados

```gherkin
Funcionalidade: Cadastro e login de usuários

  Cenário: cadastro com dados válidos cria o usuário
    Dado que não existe usuário com o e-mail "ana@pda.org"
    Quando envio POST /auth/register com nome "Ana", e-mail "ana@pda.org" e senha "senha12345"
    Então a resposta tem status 201
    E o corpo contém o nome "Ana" e o e-mail "ana@pda.org"

  Cenário: cadastro com e-mail inválido é recusado
    Quando envio POST /auth/register com e-mail "isso-nao-e-email"
    Então a resposta tem status 400

  Cenário: cadastro com senha curta é recusado
    Quando envio POST /auth/register com a senha "1234567" (7 caracteres)
    Então a resposta tem status 400

  Cenário: login com credenciais válidas devolve um token de acesso
    Dado que "ana@pda.org" está cadastrada com a senha "senha12345"
    Quando envio POST /auth/login com "ana@pda.org" e "senha12345"
    Então a resposta tem status 200
    E o corpo contém "access_token"

  Cenário: login com senha errada é recusado com mensagem genérica
    Dado que "ana@pda.org" está cadastrada com a senha "senha12345"
    Quando envio POST /auth/login com "ana@pda.org" e "senha-errada"
    Então a resposta tem status 401
    E a mensagem é "Credenciais inválidas"

  Cenário: login com e-mail inexistente é recusado com a mesma mensagem genérica
    Dado que não existe usuário com o e-mail "ninguem@pda.org"
    Quando envio POST /auth/login com "ninguem@pda.org" e "senha12345"
    Então a resposta tem status 401
    E a mensagem é "Credenciais inválidas"

Funcionalidade: Consulta e gestão de usuários

  Cenário: listar usuários sem token é recusado
    Quando envio GET /users sem o cabeçalho Authorization
    Então a resposta tem status 401

  Cenário: listar usuários com token devolve os usuários cadastrados
    Dado que "Ana" e "Bruno" estão cadastrados
    E que Ana está autenticada
    Quando envio GET /users com o token da Ana
    Então a resposta tem status 200
    E os nomes listados são "Ana" e "Bruno"

  Cenário: GET /users/me devolve o usuário logado
    Dado que "Ana" e "Bruno" estão cadastrados
    E que Bruno está autenticado
    Quando envio GET /users/me com o token do Bruno
    Então a resposta tem status 200
    E o e-mail devolvido é "bruno@pda.org"

  Cenário: buscar usuário por id devolve o usuário
    Dado que Ana está cadastrada e autenticada
    Quando envio GET /users/{idAna} com o token da Ana
    Então a resposta tem status 200
    E o nome devolvido é "Ana"

  Cenário: buscar usuário inexistente devolve 404
    Dado que Ana está autenticada
    Quando envio GET /users/00000000-0000-4000-8000-000000000000
    Então a resposta tem status 404

  Cenário: atualizar o nome do usuário persiste a mudança
    Dado que Ana está cadastrada e autenticada
    Quando envio PATCH /users/{idAna} com o nome "Ana Souza"
    Então a resposta tem status 200
    E o nome devolvido é "Ana Souza" e o e-mail continua "ana@pda.org"

  Cenário: apagar a própria conta devolve 204 e o usuário deixa de existir
    Dado que Ana e Bruno estão cadastrados e autenticados
    Quando Ana envia DELETE /users/{idAna} com o próprio token
    Então a resposta tem status 204
    E GET /users/{idAna} devolve 404
```

## Cenários da aula 15 — implementados (antes pendentes)

> Estes três cenários estavam descritos sem teste. Cada um virou um arquivo em
> [`test/bdd/`](../../test/bdd/) e passou pelo ciclo red, green, refactor
> (ver `LOG-RED-GREEN-REFACTOR-<n>.md` na raiz).

| Cenário | Critério | Teste |
|---|---|---|
| cadastro com e-mail já cadastrado é recusado | 7 | [`cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts`](../../test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts) |
| a senha nunca aparece nas respostas da API | 8 | [`a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts`](../../test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts) |
| usuário não pode apagar a conta de outra pessoa | 9 | [`usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts`](../../test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts) |

```gherkin
Funcionalidade: Cadastro e login de usuários

  Cenário: cadastro com e-mail já cadastrado é recusado
    Dado que "ana@pda.org" já está cadastrada
    Quando envio POST /auth/register com nome "Outra Ana", e-mail "ana@pda.org" e senha "senha12345"
    Então a resposta tem status 409
    E existe apenas 1 usuário com o e-mail "ana@pda.org"

Funcionalidade: Consulta e gestão de usuários

  Cenário: a senha nunca aparece nas respostas da API
    Dado que Ana está cadastrada e autenticada
    Quando envio GET /users/{idAna} com o token da Ana
    Então a resposta tem status 200
    E o corpo não contém o campo "password"
    E o corpo não contém o campo "passwordHash"

  Cenário: usuário não pode apagar a conta de outra pessoa
    Dado que Ana e Bruno estão cadastrados
    E que Bruno está autenticado
    Quando Bruno envia DELETE /users/{idAna} com o token do Bruno
    Então a resposta tem status 403
    E a conta da Ana continua existindo: GET /users/{idAna} com o token da Ana devolve 200
```

## Como eu vou saber que funcionou

- `npm run verify` passa (lint, tipos, build, testes com cobertura e audit).
- Cada cenário desta spec tem um teste cujo nome é a frase do `Cenário:`.
- A pasta `3. Cenários BDD` da coleção Postman fica toda verde (agora que os três cenários estão implementados).

## Linguagem ubíqua

| Termo | O que significa neste projeto |
|---|---|
| Usuário | Pessoa cadastrada, com nome, e-mail e senha. |
| Token de acesso | JWT devolvido no login, enviado em `Authorization: Bearer`. |
| Dono da conta | O usuário cujo id é o `sub` do token. |
