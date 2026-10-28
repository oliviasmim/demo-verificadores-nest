# `.agents/`: setup de IA do projeto

Tudo que configura agentes de código fica aqui, **independente de
ferramenta**. O resumo operacional está no [`AGENTS.md`](../AGENTS.md).

```
.agents/
  skills/<nome>/SKILL.md   receitas que o agente carrega quando o assunto bate (+ reference.md)
  agents/<nome>.md         subagentes especializados (formato do Claude Code)
  hooks/*.mjs              verificadores determinísticos (scripts Node, sem dependências)
  sync.mjs                 copia skills/ e agents/ para .claude/ onde não há symlink
```

## O que é cada coisa

| Peça | O que é | Quando entra em ação |
|---|---|---|
| **AGENTS.md** | Instruções do projeto (padrão aberto, [agents.md](https://agents.md)) | Toda sessão, como contexto |
| **Skills** | Procedimentos com passos e exemplos | Quando a descrição ("Use quando...") bate com o pedido |
| **Agents** | Subagentes com ferramentas restritas e foco único (revisar, desconfiar, traduzir) | Quando o agente principal delega |
| **Hooks** | Scripts que o Claude Code executa em eventos (antes/depois de ferramenta, ao parar) | Sempre, sem depender do agente "lembrar" |

Skills (agentes decidem usar) e AGENTS.md (agentes leem) são *orientação*.
Hooks são *verificadores*: bloqueiam, perguntam ou devolvem erro de verdade.

### Skills

`nestjs-recurso`, `nestjs-auth-jwt`, `nestjs-testes`, `bdd-para-teste`,
`caca-teste-inutil`, `verificar-antes-de-pronto`.

### Agents

`revisor-de-seguranca` (só leitura), `cetico-de-testes` (quebra o código de
propósito e sempre restaura), `tradutor-bdd` (escreve só o teste RED).

### Hooks

| Script | Evento | Faz |
|---|---|---|
| `proteger-verificadores.mjs` | PreToolUse `Edit\|Write\|MultiEdit` | `ask` ao baixar cobertura, mexer no CI/ESLint/scripts de verificação, `eslint-disable`, `xit`; `deny` para `.only`/`.skip` |
| `bloquear-comandos-perigosos.mjs` | PreToolUse `Bash` | `deny` para `--no-verify`, `push --force`, push na `main`, `npm audit fix --force`; `ask` para pacote novo (slopsquatting) |
| `lint-no-arquivo-editado.mjs` | PostToolUse `Edit\|Write\|MultiEdit` | ESLint (sem `--fix`) no `.ts` editado; devolve o erro ao agente |
| `nao-diga-pronto-sem-prova.mjs` | Stop | Se `src/` ou `test/` mudou, roda lint, typecheck e jest; se falhar, bloqueia a parada uma vez |

O hook de Stop respeita `stop_hook_active` para não entrar em loop: um RED
intencional não trava o agente, mas ele é obrigado a declará-lo.

Teste os hooks com `npm run agents:test-hooks` (manda JSON de exemplo no stdin
de cada um e confere a decisão). Ficam fora do Jest e do `lint`/`typecheck`
(só olham `src` e `test`), então não afetam a cobertura.

## Por que `.agents/` e não `.claude/`

- Skills seguem um formato (`SKILL.md` com `name` e `description`) que mais de
  uma ferramenta lê; o OpenAI Codex, por exemplo, procura skills em `.agents/skills`.
- Uma única cópia evita divergência entre ferramentas.
- O Claude Code procura em `.claude/skills` e `.claude/agents`, então `.claude/`
  só faz a **ponte**:

```
.claude/skills -> ../.agents/skills     (symlink relativo)
.claude/agents -> ../.agents/agents     (symlink relativo)
.claude/settings.json                   (registra os hooks de .agents/hooks)
```

O `CLAUDE.md` apenas importa `@AGENTS.md`.

## Aviso para Windows

Com `core.symlinks=false`, o git clona o symlink como **arquivo de texto**, e o
Claude Code não enxerga skills nem agentes. Nesse caso rode:

```bash
npm run agents:sync
```

O script substitui o "link" por uma cópia de `.agents/skills` e `.agents/agents`
em `.claude/`. Rode de novo após editar algo em `.agents/` (ou habilite
symlinks: modo desenvolvedor do Windows + `git config core.symlinks true` e
reclone). Se os symlinks já funcionam, o script não faz nada.

Os hooks são Node puro (sem `jq` nem bash-isms), portáveis para o Git Bash.

## Como editar

1. Altere sempre em `.agents/` (nunca em `.claude/skills|agents`).
2. Skill nova: `.agents/skills/<nome>/SKILL.md` com frontmatter `name` e
   `description` ("Use quando ..."); material longo em `reference.md`.
3. Hook novo: script em `.agents/hooks/`, registro em `.claude/settings.json` e
   caso(s) em `.agents/hooks/testar-hooks.mjs`.
