# Plano: specs do módulo de postagens

**Last Updated:** 2026-10-28

Contexto, decisões, rotas e critérios EARS: [`modulo-postagens-context.md`](./modulo-postagens-context.md).
Passo a passo: [`modulo-postagens-tasks.md`](./modulo-postagens-tasks.md).

## Abordagem

Escrever a spec no mesmo formato da spec de usuários e deixar todos os
cenários como **pendentes**. Cada cenário vira, depois, uma tarefa do ciclo
BDD do `AGENTS.md`: RED em `test/bdd/<slug>.e2e-spec.ts` (commit `test:`),
GREEN em `src/posts/` (commit `feat:`), REFACTOR opcional (commit
`refactor:`) e log `LOG-RED-GREEN-REFACTOR-<n>.md`.

Nada em `src/` nem em testes nesta tarefa.

## Arquivos

| Ação | Arquivo |
|---|---|
| criar | `docs/specs/SPEC-postagens.md` (mesmas seções de `SPEC-usuarios-autenticacao.md`: Contexto, Decisão, Fora de escopo, Critérios EARS, Cenários pendentes, Como eu vou saber que funcionou, Linguagem ubíqua) |
| criar | `docs/specs/features/postagens.feature` (`# language: pt`, `Funcionalidade: Postagens`, todos os cenários sob o bloco `PENDENTES`) |
| editar | `docs/SEGURANCA.md`: regras 9 a 12 com estado "exigido pela spec (cenário pendente)" e um item novo no checklist |
| editar | `test/bdd/README.md`: citar `SPEC-postagens.md` também como origem de cenários pendentes |

## Cenários

Personas e dados iguais aos da spec atual: Ana (`ana@pda.org`), Bruno
(`bruno@pda.org`), senha `senha12345`. Postagem padrão: título
"Primeiro post", conteúdo "Olá, turma!". Os 14 cenários, com o critério EARS
e o arquivo de teste de cada um, estão em [`modulo-postagens-tasks.md`](./modulo-postagens-tasks.md) (fase 2).

Cada `Então` tem valor exato (ex.: lista de títulos `["Post do Bruno"]`,
`authorId` igual ao id da Ana), nunca só "tem algo".

## Regras novas em `docs/SEGURANCA.md`

| # | Regra |
|---|---|
| 9 | `authorId` vem de `req.user.id`, nunca do corpo (400 se vier) |
| 10 | Só o autor edita/apaga a postagem (403 para outra pessoa), contra IDOR |
| 11 | Escrita em `/posts` exige token; leitura é pública (guard por rota, não na classe) |
| 12 | Resposta de postagem não embute o usuário (só `authorId`) |

Checklist: "Rotas públicas são só as de leitura previstas na spec?"

## Verificação

- Conferência manual: o `.feature` começa com `# language: pt`; cada
  `Cenário:` tem Dado/Quando/Então; a frase bate com `modulo-postagens-tasks.md` e com o
  Gherkin repetido no `.md` (ESLint/Prettier não olham `.md` nem `.feature`).
- `npm run verify` continua verde (nenhum código muda).
- Opcional: rodar o subagente `tradutor-bdd` só no primeiro cenário para
  confirmar que ele vira teste RED sem ambiguidade.

## Git

Sem commit até a usuária pedir. Se pedir: branch `docs/spec-postagens`,
commit `docs: adiciona spec do módulo de postagens`, PR para a `main`.
