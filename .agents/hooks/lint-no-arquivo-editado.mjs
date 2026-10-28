#!/usr/bin/env node
// PostToolUse em Edit|Write|MultiEdit.
//
// Propósito: feedback imediato. Depois de editar um .ts em src/ ou test/, roda
// `npx eslint <arquivo>` (SEM --fix: sensor reporta, não conserta) e, se
// falhar, devolve o erro ao Claude para ele corrigir na hora. Não roda tsc
// aqui (lento); o typecheck fica para o hook de Stop e para o npm run verify.
//
// Formato (https://code.claude.com/docs/en/hooks): em PostToolUse, a saída
// JSON {"decision":"block","reason":"..."} entrega o motivo ao Claude.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { lerEntrada, raizDoProjeto, relativo, rodar, ultimasLinhas } from './_lib.mjs';

const entrada = lerEntrada();
if (!['Edit', 'Write', 'MultiEdit'].includes(entrada.tool_name)) process.exit(0);

const raiz = raizDoProjeto(entrada);
const arquivo = entrada.tool_input?.file_path;
const rel = relativo(raiz, arquivo);

const ehTsDoProjeto =
  rel.endsWith('.ts') && (rel.startsWith('src/') || rel.startsWith('test/'));
if (!ehTsDoProjeto || !existsSync(path.resolve(raiz, rel))) process.exit(0);

const r = rodar('npx', ['--no-install', 'eslint', rel], {
  cwd: raiz,
  timeout: 90_000,
});

// Se o eslint nem chegou a rodar (timeout, binário ausente), não atrapalha.
if (r.erro || r.sinal) process.exit(0);

if (r.status !== 0) {
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason: `O ESLint apontou problemas em ${rel}. Corrija (sem eslint-disable e sem --fix em massa) antes de continuar:\n\n${ultimasLinhas(r.saida, 40)}`,
    }),
  );
}
process.exit(0);
