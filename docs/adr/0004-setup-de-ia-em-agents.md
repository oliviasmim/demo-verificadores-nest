# ADR 0004: setup de IA em `.agents/`, com `.claude/` só como ponte

## Contexto

O time pode usar mais de uma ferramenta (Claude Code, Codex, Cursor). Manter
instruções, skills e agentes duplicados em formatos diferentes gera divergência.
Além disso, instrução em texto pode ser ignorada; precisamos de controles
determinísticos para os verificadores.

## Decisão

- `AGENTS.md` (padrão aberto, agents.md) é a **fonte única** de instruções. O
  `CLAUDE.md` só importa `@AGENTS.md` e acrescenta o que é específico do Claude Code.
- Skills, subagentes e hooks moram em `.agents/` (agnóstico de ferramenta). O
  Codex lê skills de `.agents/skills`.
- `.claude/skills` e `.claude/agents` são symlinks relativos para `.agents/`;
  `.claude/settings.json` registra os hooks. `npm run agents:sync` copia as
  pastas onde symlink não funciona (Windows com `core.symlinks=false`).
- Hooks são scripts Node sem dependências, testados por `npm run agents:test-hooks`
  (fora do Jest, para não mexer na cobertura).

## Consequências

- Uma edição em `.agents/` vale para todas as ferramentas.
- Hooks (verificadores determinísticos) cobrem o que instrução não garante.
- Quem está no Windows sem symlink precisa rodar `agents:sync` após mudar `.agents/`.
- Formatos de hooks e subagentes são do Claude Code; outras ferramentas usam só
  `AGENTS.md` e skills.
