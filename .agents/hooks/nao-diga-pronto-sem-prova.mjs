#!/usr/bin/env node
// Stop: roda quando o Claude vai encerrar a resposta.
//
// Propósito: o agente não diz "pronto" sem um sinal que não seja a palavra
// dele. Se há mudança em src/ ou test/ em relação ao HEAD, roda lint,
// typecheck e jest (sem cobertura). Se algum falhar, bloqueia a parada
// (decision "block") e devolve o motivo ao Claude.
//
// Regras de segurança contra loop:
//  - stop_hook_active === true  -> já estamos continuando por causa deste
//    hook; sai 0. Por isso um RED intencional (fase vermelha de um ciclo BDD)
//    não trava o agente: ele só é obrigado a DECLARAR que o teste falha.
//  - sem mudanças em src/ ou test/ -> conversa sem código; sai 0.
import { lerEntrada, raizDoProjeto, rodar, ultimasLinhas } from './_lib.mjs';

const entrada = lerEntrada();
if (entrada.stop_hook_active === true) process.exit(0);

const raiz = raizDoProjeto(entrada);

const status = rodar('git', ['status', '--porcelain'], { cwd: raiz });
if (status.status !== 0) process.exit(0); // não é repo git: nada a verificar

const mudouCodigo = status.saida
  .split('\n')
  .filter(Boolean)
  .some((linha) => /(^|\s|-> )"?(src|test)\//.test(linha.slice(3)));
if (!mudouCodigo) process.exit(0);

const sensores = [
  { nome: 'lint (npm run lint)', cmd: 'npm', args: ['run', 'lint'] },
  { nome: 'typecheck (npm run typecheck)', cmd: 'npm', args: ['run', 'typecheck'] },
  { nome: 'testes (npx jest --silent)', cmd: 'npx', args: ['--no-install', 'jest', '--silent'] },
];

const falhas = [];
for (const s of sensores) {
  const r = rodar(s.cmd, s.args, { cwd: raiz, timeout: 300_000 });
  if (r.status !== 0 && !(r.erro || r.sinal)) {
    falhas.push(`### Falhou: ${s.nome}\n${ultimasLinhas(r.saida, 30)}`);
  }
}

if (falhas.length) {
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        `Você alterou src/ ou test/ e algum verificador não está verde.\n\n${falhas.join('\n\n')}\n\n` +
        'Se for fase RED intencional de um ciclo BDD, diga isso explicitamente à pessoa, citando o teste que falha e o motivo esperado; caso contrário, corrija antes de dizer que terminou.',
    }),
  );
}
process.exit(0);
