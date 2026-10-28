// Funções compartilhadas pelos hooks. Só usa módulos nativos do Node (sem
// dependências), então roda igual em macOS, Linux e Windows (Git Bash/cmd).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Lê o JSON que o Claude Code manda no stdin do hook.
export function lerEntrada() {
  try {
    const bruto = readFileSync(0, 'utf8');
    return bruto.trim() ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
}

// Raiz do projeto: $CLAUDE_PROJECT_DIR (definida pelo Claude Code), senão o
// cwd do evento, senão o diretório atual.
export function raizDoProjeto(entrada) {
  return path.resolve(
    process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd(),
  );
}

// Caminho relativo à raiz, sempre com "/" (facilita comparar no Windows).
export function relativo(raiz, arquivo) {
  if (!arquivo) return '';
  const abs = path.resolve(raiz, arquivo);
  return path.relative(raiz, abs).split(path.sep).join('/');
}

// PreToolUse: responde com uma decisão de permissão ("ask" ou "deny").
// Formato documentado em https://code.claude.com/docs/en/hooks
export function decidir(decisao, motivo) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decisao,
        permissionDecisionReason: motivo,
      },
    }),
  );
  process.exit(0);
}

// Roda um comando sem shell no macOS/Linux; no Windows precisa de shell para
// achar npm.cmd/npx.cmd. Os argumentos são sempre fixos ou caminhos do repo.
export function rodar(cmd, args, opcoes = {}) {
  const win = process.platform === 'win32';
  const aspas = (a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
  const r = win
    ? spawnSync([cmd, ...args].map(aspas).join(' '), {
        shell: true,
        encoding: 'utf8',
        ...opcoes,
      })
    : spawnSync(cmd, args, { encoding: 'utf8', ...opcoes });
  return {
    status: r.status,
    saida: `${r.stdout ?? ''}${r.stderr ?? ''}`,
    erro: r.error,
    sinal: r.signal,
  };
}

// Últimas N linhas de um texto (sem códigos de cor ANSI).
export function ultimasLinhas(texto, n = 30) {
  // eslint-disable-next-line no-control-regex
  const limpo = texto.replace(/\u001b\[[0-9;]*m/g, '').trimEnd();
  return limpo.split('\n').slice(-n).join('\n');
}
