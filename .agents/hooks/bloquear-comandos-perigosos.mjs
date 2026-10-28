#!/usr/bin/env node
// PreToolUse em Bash.
//
// Propósito: barrar comandos que furam os verificadores ou o fluxo de PR:
//   deny: git commit --no-verify (ou -n), git push --force/-f,
//         npm audit fix --force, git push direto na main;
//   ask : npm install/i/add <pacote novo> (risco de "slopsquatting": pacote
//         com nome inventado por IA que alguém registrou com malware).
// `npm ci` e `npm install` sem argumentos passam.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { decidir, lerEntrada, raizDoProjeto, rodar } from './_lib.mjs';

const entrada = lerEntrada();
if (entrada.tool_name !== 'Bash') process.exit(0);

const raiz = raizDoProjeto(entrada);
const comando = entrada.tool_input?.command ?? '';

// Quebra o comando em segmentos (&&, ||, ;, |, quebra de linha) e cada
// segmento em palavras, respeitando aspas simples e duplas.
function segmentos(texto) {
  const saida = [];
  let atual = [];
  let palavra = '';
  let aspa = null;
  let temPalavra = false;
  const fechaPalavra = () => {
    if (temPalavra) atual.push(palavra);
    palavra = '';
    temPalavra = false;
  };
  const fechaSegmento = () => {
    fechaPalavra();
    if (atual.length) saida.push(atual);
    atual = [];
  };
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspa) {
      if (c === aspa) aspa = null;
      else palavra += c;
    } else if (c === '"' || c === "'") {
      aspa = c;
      temPalavra = true;
    } else if (/\s/.test(c) && c !== '\n') {
      fechaPalavra();
    } else if (c === '\n' || c === ';' || c === '|' || c === '&') {
      fechaSegmento();
    } else {
      palavra += c;
      temPalavra = true;
    }
  }
  fechaSegmento();
  return saida;
}

function dependenciasConhecidas() {
  try {
    const arq = path.join(raiz, 'package.json');
    if (!existsSync(arq)) return new Set();
    const pkg = JSON.parse(readFileSync(arq, 'utf8'));
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}

// "@nestjs/cli@11.0.0" -> "@nestjs/cli"; "lodash@latest" -> "lodash"
function nomeDoPacote(arg) {
  const semPrefixo = arg.replace(/^npm:/, '');
  const i = semPrefixo.indexOf('@', 1);
  return i === -1 ? semPrefixo : semPrefixo.slice(0, i);
}

function ramoAtual() {
  const r = rodar('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: raiz });
  return r.status === 0 ? r.saida.trim() : '';
}

const deny = [];
const ask = [];
const conhecidas = dependenciasConhecidas();

for (const palavras of segmentos(comando)) {
  // Ignora variáveis de ambiente no começo (FOO=bar npm i x).
  while (palavras.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(palavras[0])) palavras.shift();
  const [bin, sub, ...resto] = palavras;
  const todos = palavras.slice(1);
  const flags = todos.filter((p) => p.startsWith('-'));

  if (bin === 'git' && sub === 'commit') {
    const curtas = flags.filter((f) => /^-[a-zA-Z]+$/.test(f));
    if (flags.includes('--no-verify') || curtas.some((f) => f.includes('n'))) {
      deny.push('git commit com --no-verify/-n pula os hooks de verificação');
    }
  }

  if (bin === 'git' && sub === 'push') {
    const forca = flags.some((f) => f === '-f' || f.startsWith('--force'));
    if (forca) deny.push('git push --force/-f reescreve o histórico remoto');
    const args = resto.filter((p) => !p.startsWith('-'));
    // args = [remoto, refspec...]
    const refspecs = args.slice(1);
    const aMain = (r) => /^(\+)?(.*:)?(refs\/heads\/)?(main|master)$/.test(r);
    if (refspecs.some(aMain) || (args.length <= 1 && ['main', 'master'].includes(ramoAtual()))) {
      deny.push('push direto na main: abra um PR; a main é protegida');
    }
  }

  if (bin === 'npm' && sub === 'audit' && resto[0] === 'fix' && flags.includes('--force')) {
    deny.push('npm audit fix --force pode trocar dependências por versões incompatíveis sem aviso');
  }

  if (['npm', 'pnpm', 'yarn'].includes(bin) && ['install', 'i', 'add'].includes(sub ?? '')) {
    const pacotes = resto.filter(
      (p) =>
        !p.startsWith('-') &&
        !/^(\.{0,2}\/|file:|git\+|https?:|github:)/.test(p) &&
        p !== '.',
    );
    const novos = pacotes.map(nomeDoPacote).filter((n) => !conhecidas.has(n));
    if (novos.length) {
      ask.push(
        `pacote(s) novo(s): ${novos.join(', ')}. Antes de instalar, confira se existe no npm, se é o pacote certo (cuidado com nome parecido ou inventado: slopsquatting), quantos downloads tem e quem mantém`,
      );
    }
  }
}

if (deny.length) decidir('deny', `Comando bloqueado: ${deny.join('; ')}.`);
if (ask.length) decidir('ask', `Confirme com a pessoa: ${ask.join('; ')}.`);
process.exit(0);
