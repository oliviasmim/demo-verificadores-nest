@AGENTS.md

## Específico do Claude Code

- Hooks ativos (`.claude/settings.json`): pedem confirmação ao enfraquecer um verificador, bloqueiam `--no-verify`/`push --force`/push na `main`, rodam ESLint no arquivo editado e, ao terminar, rodam lint, typecheck e jest se você mexeu em `src/` ou `test/`.
- Fase RED de um ciclo BDD falha de propósito: diga isso explicitamente (qual teste e por quê) quando o hook de parada reclamar.
- Skills e subagentes vêm de `.agents/` via symlinks em `.claude/` (no Windows sem symlink: `npm run agents:sync`).
