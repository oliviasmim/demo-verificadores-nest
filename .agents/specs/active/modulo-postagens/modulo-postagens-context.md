# Contexto: módulo de postagens

**Last Updated:** 2026-10-28

## Por que

A API hoje só tem Identidade (usuários + login JWT). O próximo recurso é um
módulo de **postagens**. Esta tarefa escreve **só as specs** (EARS + BDD); o
código vem depois, cenário a cenário, pelo ciclo red, green, refactor do
`AGENTS.md`.

## Decisões (confirmadas com a usuária)

- Campos: `title` + `content`.
- Leitura **pública** (`GET` sem token); escrita exige token.
- Operações: CRUD completo + filtro por autor (`GET /posts?authorId=`).
- Só o autor edita ou apaga a própria postagem (403 para outra pessoa).
- Entrega desta tarefa: só spec; todos os cenários nascem **pendentes**.

## Bounded context

**Conteúdo (postagens)**, escala M. Depende de Identidade: o autor é o
`req.user.id` (`AuthenticatedRequest`, `sub` do token).

## Modelo

`Post { id (uuid), title, content, authorId, createdAt }`. A resposta devolve
só esses campos: não embute o usuário, então não há como vazar `passwordHash`.

## Rotas

| Rota | Token | Sucesso | Erros |
|---|---|---|---|
| `POST /posts` | sim | 201 | 400 (validação ou `authorId` no corpo), 401 |
| `GET /posts` | não | 200 (ordem de criação) | — |
| `GET /posts?authorId=<uuid>` | não | 200 (pode ser `[]`) | 400 se não for UUID |
| `GET /posts/:id` | não | 200 | 404 |
| `PATCH /posts/:id` | sim, autor | 200 | 400, 401, 403, 404 |
| `DELETE /posts/:id` | sim, autor | 204 | 401, 403, 404 |

Validação: `title` string de 3 a 120 caracteres; `content` string de 1 a 5000;
no `PATCH` os dois são opcionais. Ordem de checagem: 401, depois 404, depois 403.

## Critérios EARS (todos pendentes)

| # | Padrão | Critério |
|---|---|---|
| 1 | Ubíquo | A postagem guarda `authorId` igual ao `sub` do token, nunca um valor vindo do corpo. |
| 2 | Evento | Quando uma postagem válida é enviada com token, o sistema deve criá-la e responder 201. |
| 3 | Estado | Enquanto a requisição não trouxer token válido, `POST`, `PATCH` e `DELETE` em `/posts` respondem 401. |
| 4 | Opcional | Onde a requisição for de leitura (`GET /posts`, `GET /posts/:id`), o sistema deve responder sem exigir token. |
| 5 | Evento | Quando `authorId` vier na query, o sistema deve devolver só as postagens desse autor. |
| 6 | Indesejado | Se `title`/`content` violarem os limites ou o corpo trouxer campo desconhecido (inclusive `authorId`), então 400. |
| 7 | Indesejado | Se a postagem não existir, então 404. |
| 8 | Indesejado | Se quem não é o autor tentar editar ou apagar, então 403 e a postagem fica intacta. |
| 9 | Ubíquo | Nenhuma resposta de `/posts` inclui dados do autor além de `authorId`. |

## Fora de escopo

- Banco de dados (repositório em memória, como em `users`).
- Paginação e ordenação customizada.
- Comentários, curtidas, rascunho/publicada, papéis (moderador).
- **Candidato a cenário futuro:** o que acontece com as postagens quando o
  autor apaga a conta (hoje ficariam órfãs).

## Linguagem ubíqua

| Termo | Significado |
|---|---|
| Postagem | Texto com título e conteúdo, criado por um usuário. |
| Autor | Usuário cujo id é o `authorId` da postagem. |
| Leitor | Qualquer pessoa, com ou sem token. |

## Referências no repositório

- Formato da spec: `docs/specs/SPEC-usuarios-autenticacao.md`.
- Formato do `.feature`: `docs/specs/features/consulta-e-gestao-de-usuarios.feature`.
- Regras de segurança: `docs/SEGURANCA.md` (checagem de dono, não expor hash).
- Modelo de recurso: `src/users/`, skill `nestjs-recurso`.
- Ciclo BDD: skill `bdd-para-teste`, subagente `tradutor-bdd`, `test/bdd/README.md`.
