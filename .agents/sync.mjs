#!/usr/bin/env node
// Garante que o Claude Code enxergue .agents/skills e .agents/agents.
//
// Normalmente .claude/skills e .claude/agents são symlinks para ../.agents/...
// No Windows, git com core.symlinks=false clona symlink como arquivo de texto.
// Nesse caso (ou se o link estiver quebrado) este script troca o "link"
// por uma cópia real das pastas. Rode de novo depois de editar .agents/.
// Uso: npm run agents:sync
import { cpSync, existsSync, lstatSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pastas = ['skills', 'agents'];

mkdirSync(path.join(raiz, '.claude'), { recursive: true });

for (const nome of pastas) {
  const origem = path.join(raiz, '.agents', nome);
  const destino = path.join(raiz, '.claude', nome);

  let ehLink = false;
  try {
    ehLink = lstatSync(destino).isSymbolicLink();
  } catch {
    /* não existe */
  }

  // existsSync segue o link: false significa "não existe" ou "link quebrado".
  if (ehLink && existsSync(destino)) {
    console.log(`.claude/${nome}: symlink funcionando, nada a fazer.`);
    continue;
  }

  rmSync(destino, { recursive: true, force: true }); // arquivo-texto, link quebrado ou cópia antiga
  cpSync(origem, destino, { recursive: true });
  console.log(`.claude/${nome}: copiado de .agents/${nome} (sem symlink).`);
}
