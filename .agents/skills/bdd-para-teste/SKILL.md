---
name: bdd-para-teste
description: Transforma um Cenário Gherkin de docs/specs/features/*.feature em teste automatizado seguindo o ciclo red, green, refactor, com commits separados e log com saídas reais. Use quando o pedido for implementar ou testar um cenário da spec, "fazer o BDD", ou "red/green/refactor".
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm run *), Bash(npx jest *), Bash(npx eslint *), Bash(git add *), Bash(git commit *), Bash(git log *), Bash(git status *), Bash(git diff *)
---

# BDD para teste (red, green, refactor)

## O que ela faz

Pega **um** `Cenário:` e o leva até a implementação passando por um teste que
**falha primeiro, pelo motivo certo**. A prova de que o ciclo aconteceu é a
ordem dos commits (teste antes da implementação) mais um log com saídas reais,
coladas e não resumidas. Template do log em [reference.md](reference.md).

## Quando ela dispara (e quando não deveria)

- Dispara: "implemente o cenário `<frase>` da spec", "faça o ciclo red/green para este cenário".
- Não dispara: "escreva testes para a classe X" (use `nestjs-testes`); "corrija este bug" sem cenário (escreva um teste que reproduz, mas fora deste fluxo).

## Passos

Faça **um cenário por vez**.

1. **Escolher o cenário.** Leia `docs/specs/features/*.feature` e
   `docs/specs/SPEC-usuarios-autenticacao.md`. Veja o que já tem teste em
   `test/` e `test/bdd/` (procure a frase do cenário com `grep`). Anote o slug, ex.:
   `cadastro-com-email-ja-cadastrado-e-recusado`.
2. **RED.** Crie `test/bdd/<slug>.e2e-spec.ts`:
   - `it('<frase exata do Cenário>', ...)`;
   - comentários `// Dado`, `// Quando`, `// Então` para cada passo;
   - `criarApp()` de `test/helpers/criar-app.ts`, app novo por teste;
   - asserts com os valores exatos do cenário (status, mensagem, estado depois).

   ```ts
   import { INestApplication } from '@nestjs/common';
   import request from 'supertest';
   import { App } from 'supertest/types';
   import { criarApp } from '../helpers/criar-app';

   describe('Usuários (BDD)', () => {
     let app: INestApplication<App>;
     beforeEach(async () => { app = await criarApp(); });
     afterEach(async () => { await app.close(); });

     it('<frase exata do Cenário>', async () => {
       // Dado ...
       // Quando ...
       // Então ...
     });
   });
   ```

3. **Rodar e ler a falha:** `npx jest test/bdd/<slug>.e2e-spec.ts`. Confirme que
   falha **pelo motivo do cenário** (ex.: `Expected: 409, Received: 201`). Se
   falhar por erro de import, tipo ou setup, o RED não vale: conserte o teste
   até ele falhar pelo comportamento que falta. Cole a saída real.
4. **Commit só do teste** (`git add test/bdd/<slug>.e2e-spec.ts`):
   `test: red - <frase do cenário> (falha, esperado)`. Nada de `src/` neste commit.
   O hook de parada pode reclamar da falha: diga explicitamente que é RED
   intencional, citando o teste e o motivo.
5. **GREEN.** O **mínimo** em `src/` para passar; não generalize além do que o
   teste pede. Rode o teste do cenário e depois `npx jest`. Commit:
   `feat: green - <descrição> (teste passa)`.
6. **REFACTOR (opcional).** Limpe com os testes verdes (nomes, duplicação). Não
   mude comportamento. Rode `npx jest` de novo. Commit: `refactor: <descrição>`.
7. **Verificação de ordem:** `git log --oneline -- test/bdd/<slug>.e2e-spec.ts src/`.
   O commit do teste tem que aparecer **antes** (mais antigo) do da implementação.
8. **Log:** copie o template de [reference.md](reference.md) para
   `LOG-RED-GREEN-REFACTOR-<n>.md` na raiz e preencha com hashes e saídas reais.
   Não reconstitua depois: o log narra o que de fato aconteceu.
9. **Fechamento:** `npm run verify` e mostre a saída (skill `verificar-antes-de-pronto`).

## Regras

- Nunca escreva teste e implementação no mesmo commit.
- Nunca ajuste o teste para passar sem entender por que falhou.
- O cenário é a fonte da verdade: não altere `docs/specs/` para "casar" com o código.
- Sem `.skip`/`.only`. Teste vermelho só no commit RED.

## Exemplo de invocação

```
Use a skill bdd-para-teste no cenário "cadastro com e-mail já cadastrado é recusado".
```

Resultado: arquivo em `test/bdd/`, commit RED com falha pelo motivo certo,
commit GREEN, `LOG-RED-GREEN-REFACTOR-1.md` com saídas reais.
