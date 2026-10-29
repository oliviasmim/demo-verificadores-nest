# Tarefas: módulo de postagens

**Last Updated:** 2026-10-28

Ver [`modulo-postagens-context.md`](./modulo-postagens-context.md) e [`modulo-postagens-plan.md`](./modulo-postagens-plan.md).

## Fase 1: specs (esta tarefa)

- [ ] 1.1 Criar `docs/specs/features/postagens.feature` com os 14 cenários da fase 2, todos sob `PENDENTES`.
- [ ] 1.2 Criar `docs/specs/SPEC-postagens.md` (EARS do `context.md` + o mesmo Gherkin do `.feature`).
- [ ] 1.3 Atualizar `docs/SEGURANCA.md` (regras 9 a 12 + checklist).
- [ ] 1.4 Atualizar `test/bdd/README.md` (citar a spec nova).
- [ ] 1.5 Conferir frases dos cenários (`.feature` = `.md` = tabela abaixo) e rodar `npm run verify`.

## Fase 2: ciclo BDD por cenário (depois, uma tarefa por linha)

Para cada linha, seguir o fluxo do `AGENTS.md` (skill `bdd-para-teste`):

1. **RED:** `test/bdd/<arquivo>`, `it(...)` com a frase exata do cenário; rodar e confirmar que falha pelo motivo do cenário. Commit `test:`.
2. **GREEN:** o mínimo em `src/posts/`. Commit `feat:`.
3. **REFACTOR** (opcional), com testes verdes. Commit `refactor:`.
4. Registrar as saídas reais em `LOG-RED-GREEN-REFACTOR-<n>.md`.

A T1 cria o esqueleto do módulo (`src/posts/`, registro no `AppModule`), seguindo a skill `nestjs-recurso`.

| | T | Cenário (frase exata) | EARS | Arquivo em `test/bdd/` |
|---|---|---|---|---|
| [ ] | 1 | criar postagem com token devolve 201 e o autor é o usuário logado | 1, 2 | `criar-postagem-com-token.e2e-spec.ts` |
| [ ] | 2 | criar postagem sem token é recusado | 3 | `criar-postagem-sem-token.e2e-spec.ts` |
| [ ] | 3 | criar postagem com título curto é recusado | 6 | `criar-postagem-titulo-curto.e2e-spec.ts` |
| [ ] | 4 | criar postagem informando authorId no corpo é recusado | 1, 6 | `criar-postagem-com-authorid-no-corpo.e2e-spec.ts` |
| [ ] | 5 | listar postagens sem token devolve todas as postagens | 4 | `listar-postagens-sem-token.e2e-spec.ts` |
| [ ] | 6 | filtrar postagens por autor devolve só as postagens desse autor | 5 | `filtrar-postagens-por-autor.e2e-spec.ts` |
| [ ] | 7 | filtrar postagens por autor sem postagens devolve lista vazia | 5 | `filtrar-postagens-autor-sem-postagens.e2e-spec.ts` |
| [ ] | 8 | filtrar postagens com authorId inválido é recusado | 6 | `filtrar-postagens-authorid-invalido.e2e-spec.ts` |
| [ ] | 9 | buscar postagem por id sem token devolve a postagem | 4, 9 | `buscar-postagem-por-id.e2e-spec.ts` |
| [ ] | 10 | buscar postagem inexistente devolve 404 | 7 | `buscar-postagem-inexistente.e2e-spec.ts` |
| [ ] | 11 | autor edita a própria postagem | 8 | `autor-edita-propria-postagem.e2e-spec.ts` |
| [ ] | 12 | usuário não pode editar a postagem de outra pessoa | 8 | `editar-postagem-de-outra-pessoa.e2e-spec.ts` |
| [ ] | 13 | autor apaga a própria postagem e ela deixa de existir | 8 | `autor-apaga-propria-postagem.e2e-spec.ts` |
| [ ] | 14 | usuário não pode apagar a postagem de outra pessoa | 8 | `apagar-postagem-de-outra-pessoa.e2e-spec.ts` |

### Asserts esperados (valor exato)

- **T1:** 201; `title` "Primeiro post", `content` "Olá, turma!", `authorId` = id da Ana.
- **T2:** sem `Authorization`, 401.
- **T3:** `title` "Oi" (2 caracteres), 400.
- **T4:** corpo com `authorId` do Bruno enviado pela Ana, 400.
- **T5:** Ana publica "Primeiro post" e Bruno publica "Post do Bruno"; `GET /posts` sem token, 200 e títulos `["Primeiro post", "Post do Bruno"]`.
- **T6:** mesmo Dado; `GET /posts?authorId={idBruno}`, 200 e títulos `["Post do Bruno"]`.
- **T7:** só Ana publicou; `GET /posts?authorId={idBruno}`, 200 e `[]`.
- **T8:** `GET /posts?authorId=nao-e-uuid`, 400.
- **T9:** 200; título "Primeiro post"; o corpo tem exatamente as chaves `id, title, content, authorId, createdAt`.
- **T10:** `GET /posts/00000000-0000-4000-8000-000000000000`, 404.
- **T11:** Ana faz `PATCH` com título "Post editado", 200; título "Post editado" e `authorId` continua o da Ana.
- **T12:** Bruno faz `PATCH /posts/{idPostAna}`, 403; `GET /posts/{idPostAna}` continua com título "Primeiro post".
- **T13:** Ana faz `DELETE`, 204; `GET /posts/{idPost}`, 404.
- **T14:** Bruno faz `DELETE /posts/{idPostAna}`, 403; `GET /posts/{idPostAna}`, 200.

## Fechamento

- [ ] Todas as linhas da fase 2 marcadas e `npm run verify` verde, com a saída colada.
- [ ] Mover a pasta para `.agents/specs/archive/` (convenção do `AGENTS.md`).
