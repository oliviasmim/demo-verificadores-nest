#!/usr/bin/env node
// Testa os hooks sem depender do Claude Code: manda um JSON de exemplo no
// stdin de cada script e confere o código de saída e a decisão devolvida.
// Fica fora do Jest de propósito (não mexe na cobertura do projeto).
// Uso: npm run agents:test-hooks
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..', '..');
const pkgPath = path.join(raiz, 'package.json');

function executar(script, entrada, env = {}) {
  const r = spawnSync('node', [path.join(aqui, script)], {
    input: JSON.stringify(entrada),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: raiz, ...env },
  });
  let json = null;
  try {
    json = r.stdout.trim() ? JSON.parse(r.stdout) : null;
  } catch {
    /* saída não-JSON */
  }
  const decisao =
    json?.hookSpecificOutput?.permissionDecision ?? json?.decision ?? 'nenhuma';
  return { codigo: r.status, decisao, saida: r.stdout, json };
}

const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
const edit = (file_path, old_string, new_string) => ({
  tool_name: 'Edit',
  tool_input: { file_path, old_string, new_string },
});
const write = (file_path, content) => ({
  tool_name: 'Write',
  tool_input: { file_path, content },
});

const P = 'proteger-verificadores.mjs';
const B = 'bloquear-comandos-perigosos.mjs';
const L = 'lint-no-arquivo-editado.mjs';
const S = 'nao-diga-pronto-sem-prova.mjs';

const casos = [
  // --- proteger-verificadores --------------------------------------------
  ['proteger: edição comum em src passa', P, edit(`${raiz}/src/app.setup.ts`, 'a', 'b'), 'nenhuma'],
  ['proteger: baixar threshold -> ask', P, edit(pkgPath, '"lines": 80', '"lines": 50'), 'ask'],
  ['proteger: remover threshold -> ask', P, edit(pkgPath, '"coverageThreshold": {', '"semThreshold": {'), 'ask'],
  ['proteger: subir threshold passa', P, edit(pkgPath, '"lines": 80', '"lines": 90'), 'nenhuma'],
  ['proteger: mexer no script verify -> ask', P, edit(pkgPath, 'npm run audit"', 'echo ok"'), 'ask'],
  ['proteger: workflow do CI -> ask', P, edit(`${raiz}/.github/workflows/ci.yml`, 'x', 'y'), 'ask'],
  ['proteger: eslint.config.mjs -> ask', P, edit(`${raiz}/eslint.config.mjs`, 'x', 'y'), 'ask'],
  ['proteger: it.only -> deny', P, edit(`${raiz}/test/auth.e2e-spec.ts`, "it('a'", "it.only('a'"), 'deny'],
  ['proteger: describe.skip via Write -> deny', P, write(`${raiz}/test/novo.e2e-spec.ts`, "describe.skip('x', () => {});"), 'deny'],
  ['proteger: xit -> ask', P, edit(`${raiz}/test/auth.e2e-spec.ts`, "it('a'", "xit('a'"), 'ask'],
  ['proteger: eslint-disable em .ts -> ask', P, edit(`${raiz}/src/main.ts`, 'a', '// eslint-disable-next-line\na'), 'ask'],
  ['proteger: ".skip(" em .md não conta', P, write(`${raiz}/docs/x.md`, 'it.skip(x)'), 'nenhuma'],
  ['proteger: ferramenta Read é ignorada', P, { tool_name: 'Read', tool_input: { file_path: pkgPath } }, 'nenhuma'],

  // --- bloquear-comandos-perigosos ---------------------------------------
  ['bash: npm run verify passa', B, bash('npm run verify'), 'nenhuma'],
  ['bash: npm ci passa', B, bash('npm ci'), 'nenhuma'],
  ['bash: npm install sem args passa', B, bash('npm install'), 'nenhuma'],
  ['bash: git commit normal passa', B, bash('git commit -m "feat: x"'), 'nenhuma'],
  ['bash: git commit --no-verify -> deny', B, bash('git commit -m "x" --no-verify'), 'deny'],
  ['bash: git commit -n -> deny', B, bash('git commit -n -m "x"'), 'deny'],
  ['bash: git push --force -> deny', B, bash('git push --force origin feat/x'), 'deny'],
  ['bash: git push -f -> deny', B, bash('git push -f origin feat/x'), 'deny'],
  ['bash: git push origin main -> deny', B, bash('git push origin main'), 'deny'],
  ['bash: git push origin feat/x passa', B, bash('git push origin feat/x'), 'nenhuma'],
  ['bash: npm audit fix --force -> deny', B, bash('npm audit fix --force'), 'deny'],
  ['bash: npm audit passa', B, bash('npm audit --audit-level=high'), 'nenhuma'],
  ['bash: npm i pacote novo -> ask', B, bash('npm i lodash-super-validador'), 'ask'],
  ['bash: npm install pacote novo com versão -> ask', B, bash('npm install --save-dev @acme/inventado@1.2.3'), 'ask'],
  ['bash: npm i pacote já existente passa', B, bash('npm i bcryptjs'), 'nenhuma'],
  ['bash: comando encadeado com --no-verify -> deny', B, bash('git add . && git commit -m "x" --no-verify'), 'deny'],

  // --- lint-no-arquivo-editado -------------------------------------------
  ['lint: arquivo .ts limpo passa', L, { tool_name: 'Edit', tool_input: { file_path: `${raiz}/src/app.setup.ts` } }, 'nenhuma'],
  ['lint: arquivo fora de src/test é ignorado', L, { tool_name: 'Edit', tool_input: { file_path: `${raiz}/README.md` } }, 'nenhuma'],
  ['lint: arquivo inexistente é ignorado', L, { tool_name: 'Write', tool_input: { file_path: `${raiz}/src/nao-existe.ts` } }, 'nenhuma'],
];

let falhou = 0;
function registrar(nome, ok, detalhe) {
  console.log(`${ok ? 'OK    ' : 'FALHOU'}  ${nome}${ok ? '' : `\n        ${detalhe}`}`);
  if (!ok) falhou++;
}

for (const [nome, script, entrada, esperado] of casos) {
  const r = executar(script, entrada);
  registrar(
    nome,
    r.codigo === 0 && r.decisao === esperado,
    `esperado exit 0 + "${esperado}", veio exit ${r.codigo} + "${r.decisao}" ${r.saida}`,
  );
}

// Lint com erro: cria um arquivo .ts ruim em test/ (temporário) e apaga depois.
const ruim = path.join(raiz, 'test', '__hook-lint-tmp.ts');
writeFileSync(ruim, 'const x = 1\nvar  y=2;;\n');
try {
  const r = executar(L, { tool_name: 'Write', tool_input: { file_path: ruim } });
  registrar(
    'lint: arquivo .ts com erro -> block com reason',
    r.codigo === 0 && r.decisao === 'block' && /__hook-lint-tmp/.test(r.json?.reason ?? ''),
    `veio exit ${r.codigo} + "${r.decisao}" ${r.saida}`,
  );
} finally {
  rmSync(ruim, { force: true });
}

// Stop: fixtures num repositório git temporário (não toca no projeto real).
function fixture({ scripts, alterar }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook-stop-'));
  const sh = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'f', scripts }));
  mkdirSync(path.join(dir, 'src'));
  writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const a = 1;\n');
  // jest de mentira: `npx --no-install jest` acha em node_modules/.bin
  const bin = path.join(dir, 'node_modules', '.bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(path.join(bin, 'jest'), '#!/usr/bin/env node\nprocess.exit(0);\n');
  chmodSync(path.join(bin, 'jest'), 0o755);
  writeFileSync(path.join(bin, 'jest.cmd'), '@node -e "process.exit(0)"\r\n');
  writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n');
  sh('init', '-q');
  sh('add', '.');
  sh('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init');
  if (alterar) writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const a = 2;\n');
  return dir;
}
const ok = 'node -e "process.exit(0)"';
const ruimCmd = 'node -e "console.error(\'erro-de-lint-simulado\');process.exit(1)"';

const casosStop = [
  ['stop: stop_hook_active=true sai 0 sem rodar nada', { stop_hook_active: true }, { scripts: { lint: ruimCmd, typecheck: ok }, alterar: true }, 'nenhuma'],
  ['stop: árvore limpa (conversa sem código) sai 0', {}, { scripts: { lint: ruimCmd, typecheck: ok }, alterar: false }, 'nenhuma'],
  ['stop: mudança em src com tudo verde sai 0', {}, { scripts: { lint: ok, typecheck: ok }, alterar: true }, 'nenhuma'],
  ['stop: mudança em src com lint falhando -> block', {}, { scripts: { lint: ruimCmd, typecheck: ok }, alterar: true }, 'block'],
];
for (const [nome, entrada, cfg, esperado] of casosStop) {
  const dir = fixture(cfg);
  try {
    const r = executar(S, { hook_event_name: 'Stop', ...entrada }, { CLAUDE_PROJECT_DIR: dir });
    let extra = true;
    if (esperado === 'block') {
      const motivo = r.json?.reason ?? '';
      extra = /Falhou: lint/.test(motivo) && /erro-de-lint-simulado/.test(motivo) && /fase RED intencional/.test(motivo);
    }
    registrar(nome, r.codigo === 0 && r.decisao === esperado && extra, `veio exit ${r.codigo} + "${r.decisao}" ${r.saida}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log(falhou ? `\n${falhou} caso(s) FALHARAM` : '\nTodos os casos OK');
process.exit(falhou ? 1 : 0);
