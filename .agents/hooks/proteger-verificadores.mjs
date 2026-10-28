#!/usr/bin/env node
// PreToolUse em Edit|Write|MultiEdit.
//
// Propósito: impedir que o agente "fique verde" enfraquecendo o verificador em
// vez de consertar o código. Se a edição:
//   (a) diminui ou remove o coverageThreshold (package.json / jest.config.*);
//   (b) mexe no CI (.github/workflows/), em eslint.config.mjs ou nos scripts
//       lint/test/verify (e irmãos) do package.json;
//   (c) introduz .only( / .skip( / xit( / xdescribe( / eslint-disable em .ts;
// então pede confirmação ("ask"), e para .only/.skip nega ("deny").
//
// Um hook é determinístico: diferente de uma regra no AGENTS.md, o agente não
// consegue "esquecer" ou "ignorar" este controle.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { decidir, lerEntrada, raizDoProjeto, relativo } from './_lib.mjs';

const SCRIPTS_PROTEGIDOS = [
  'lint',
  'typecheck',
  'build',
  'test',
  'test:cov',
  'audit',
  'verify',
];
const MSG_ENFRAQUECE =
  'Isso enfraquece um verificador; confirme com a pessoa antes de seguir. ';

const entrada = lerEntrada();
const ferramenta = entrada.tool_name;
if (!['Edit', 'Write', 'MultiEdit'].includes(ferramenta)) process.exit(0);

const raiz = raizDoProjeto(entrada);
const ti = entrada.tool_input ?? {};
const rel = relativo(raiz, ti.file_path);
const abs = path.resolve(raiz, ti.file_path ?? '');

function lerAtual() {
  try {
    return existsSync(abs) ? readFileSync(abs, 'utf8') : '';
  } catch {
    return '';
  }
}

// Lista de trocas {antigo, novo} que a ferramenta pretende fazer.
function trocas() {
  if (ferramenta === 'Write') return [{ antigo: lerAtual(), novo: ti.content ?? '' }];
  if (ferramenta === 'MultiEdit') {
    return (ti.edits ?? []).map((e) => ({
      antigo: e.old_string ?? '',
      novo: e.new_string ?? '',
      todos: e.replace_all,
    }));
  }
  return [{ antigo: ti.old_string ?? '', novo: ti.new_string ?? '', todos: ti.replace_all }];
}

// Conteúdo do arquivo depois da edição (simulado), para comparar JSONs.
function conteudoFinal() {
  if (ferramenta === 'Write') return ti.content ?? '';
  let texto = lerAtual();
  for (const t of trocas()) {
    texto = t.todos
      ? texto.split(t.antigo).join(t.novo)
      : texto.replace(t.antigo, () => t.novo);
  }
  return texto;
}

function contar(texto, regex) {
  return (texto.match(regex) ?? []).length;
}

// Achata { global: { lines: 80 } } em { 'global.lines': 80 }.
function folhas(obj, prefixo = '', saida = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (v && typeof v === 'object') folhas(v, `${prefixo}${k}.`, saida);
    else saida[`${prefixo}${k}`] = v;
  }
  return saida;
}

function problemasDeThreshold(antes, depois) {
  const a = folhas(antes);
  const d = folhas(depois);
  const achados = [];
  for (const [chave, valor] of Object.entries(a)) {
    if (!(chave in d)) achados.push(`${chave} foi removido (era ${valor})`);
    else if (typeof valor === 'number' && d[chave] < valor)
      achados.push(`${chave} caiu de ${valor} para ${d[chave]}`);
  }
  return achados;
}

const ask = [];
const deny = [];

// (a) + (b) ------------------------------------------------------------------
if (rel.startsWith('.github/workflows/')) {
  ask.push('a edição mexe no CI (.github/workflows/)');
}
if (rel === 'eslint.config.mjs') {
  ask.push('a edição mexe na configuração do ESLint');
}
if (rel === 'package.json') {
  let antes;
  let depois;
  try {
    antes = JSON.parse(lerAtual());
    depois = JSON.parse(conteudoFinal());
  } catch {
    // Não deu para comparar como JSON: cai na heurística de texto.
    const textos = trocas();
    const mexe = textos.some((t) => /coverageThreshold|"(lint|test|verify)"/.test(t.antigo + t.novo));
    if (mexe) ask.push('a edição mexe em coverageThreshold ou em scripts de verificação');
  }
  if (antes && depois) {
    const t = problemasDeThreshold(antes.jest?.coverageThreshold, depois.jest?.coverageThreshold);
    if (t.length) ask.push(`o coverageThreshold ficou mais frouxo: ${t.join('; ')}`);
    for (const nome of SCRIPTS_PROTEGIDOS) {
      if (antes.scripts?.[nome] !== depois.scripts?.[nome]) {
        ask.push(`o script "${nome}" do package.json foi alterado`);
      }
    }
  }
}
if (/(^|\/)jest\.config\.[cm]?[jt]s$/.test(rel) || /(^|\/)jest\.config\.json$/.test(rel)) {
  if (trocas().some((t) => /coverageThreshold/.test(t.antigo + t.novo))) {
    ask.push('a edição mexe no coverageThreshold da configuração do Jest');
  }
}

// (c) ------------------------------------------------------------------------
if (rel.endsWith('.ts')) {
  const padroes = [
    { regex: /\.(only|skip)\(/g, rotulo: '.only( / .skip(', nega: true },
    { regex: /\b(xit|xdescribe)\(/g, rotulo: 'xit( / xdescribe(', nega: false },
    { regex: /eslint-disable/g, rotulo: 'eslint-disable', nega: false },
  ];
  const todas = trocas();
  for (const p of padroes) {
    const antes = todas.reduce((s, t) => s + contar(t.antigo, p.regex), 0);
    const depois = todas.reduce((s, t) => s + contar(t.novo, p.regex), 0);
    if (depois > antes) {
      (p.nega ? deny : ask).push(`a edição introduz ${p.rotulo} em ${rel}`);
    }
  }
}

if (deny.length) {
  decidir(
    'deny',
    `${MSG_ENFRAQUECE}Bloqueado: ${deny.join('; ')}. Teste desativado não é teste verde: corrija o teste ou o código, sem pular nada.`,
  );
}
if (ask.length) {
  decidir('ask', `${MSG_ENFRAQUECE}Motivo: ${ask.join('; ')}.`);
}
process.exit(0);
