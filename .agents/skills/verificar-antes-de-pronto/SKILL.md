---
name: verificar-antes-de-pronto
description: Roda npm run verify, lê a saída e reporta com evidência (contagem de testes, cobertura, audit); se algo falhar, não declara pronto. Use quando for dizer que uma tarefa terminou, antes de abrir PR ou commitar o fim de uma mudança.
allowed-tools: Read, Bash(npm run *), Bash(npx jest *), Bash(git status *), Bash(git diff *)
---

# Verificar antes de dizer "pronto"

## O que ela faz

Impede o "pronto" sem prova. Roda os cinco sensores via `npm run verify`
(lint, typecheck, build, testes com cobertura, audit), lê a saída de verdade e
reporta números, não adjetivos.

## Quando ela dispara (e quando não deveria)

- Dispara: "terminou?", "pode abrir o PR?", fim de qualquer tarefa que alterou `src/` ou `test/`.
- Não dispara: perguntas conceituais ou edição só de documentação.

## Passos

1. Rode `npm run verify` e leia a saída até o fim (não só a última linha).
   Se precisar isolar: `npm run lint`, `npm run typecheck`, `npm run build`,
   `npm run test:cov`, `npm run audit`.
2. Extraia a evidência:
   - **Testes:** `Tests: X passed, Y total` e `Test Suites: ...`;
   - **Cobertura:** linha `All files` (statements, branches, functions, lines) e se o piso de 80% passou;
   - **Audit:** a linha `found N vulnerabilities` (e se alguma é high/critical);
   - **Lint/typecheck/build:** terminaram sem erro (código de saída 0).
3. Se **tudo passou:** reporte com os números reais e diga o que foi verificado.
4. Se **algo falhou:** não diga "pronto". Diga qual sensor falhou, cole as linhas
   relevantes, corrija e rode de novo. Se for um RED intencional de ciclo BDD,
   diga isso explicitamente (qual teste, por quê).
5. Nunca contorne: sem baixar o piso de cobertura, `.skip`, `eslint-disable` sem
   justificativa ou `npm audit fix --force`.
6. Escopo: se a tarefa criou comportamento novo, confirme que existe teste
   escrito antes (ver `bdd-para-teste`).

## Formato do relatório

```
Verificação (npm run verify): VERDE
- lint: ok | typecheck: ok | build: ok
- testes: 45 passed, 45 total (7 suites)
- cobertura: statements 92% | branches 85% | functions 95% | lines 93% (piso 80%)
- audit: 0 vulnerabilidades high/critical (8 low em dev, documentadas no README)
```

Os números acima são exemplo de formato: use sempre os da sua execução.

## Exemplo de invocação

```
Terminei a mudança no service. Rode a verificação e me diga se posso abrir o PR.
```
