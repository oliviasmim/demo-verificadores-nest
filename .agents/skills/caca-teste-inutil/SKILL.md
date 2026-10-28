---
name: caca-teste-inutil
description: Procura testes que ficam verdes sem provar nada, quebrando a implementação de propósito e vendo se o teste continua verde; corrige e prova que o corrigido falha com a quebra, gerando relatório antes/depois. Use quando o pedido for auditar testes, achar teste inútil, "teste que não prova nada" ou desconfiar da cobertura.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npx jest *), Bash(npm run *), Bash(git checkout *), Bash(git stash *), Bash(git diff *), Bash(git status *)
---

# Caça ao teste que não prova nada

## O que ela faz

Para cada teste suspeito, quebra a implementação que ele deveria proteger,
roda só aquele teste e registra se ele continuou verde. Teste que sobrevive à
quebra não prova nada: é corrigido e a correção é provada com a mesma quebra.

## Quando ela dispara (e quando não deveria)

- Dispara: "ache testes que não provam nada", "a cobertura está alta, será que os testes valem?".
- Não dispara: "escreva testes novos" (use `nestjs-testes`).

## Passos

0. **Árvore limpa.** `git status --porcelain` deve estar vazio em `src/` e
   `test/`; se não estiver, `git stash` ou peça à pessoa para commitar. A
   reversão depende disso.
1. **Listar os testes:** `npx jest --listTests` e `grep -rnE "^\s*(it|test)\(" src test`.
2. **Escolher candidatos** pelos sinais:
   - não importa a classe real (só objetos criados dentro do teste);
   - assert fraco: `toBeDefined`, `toBeTruthy`, `not.toBeNull`, `expect(x || !x)`;
   - assert dentro de callback sem `await`/`done`;
   - nenhum assert, ou nome que promete algo que o corpo não verifica.
3. **Para cada candidato:**
   1. Identifique a implementação que ele deveria proteger (`src/...`).
   2. **Quebre de propósito** (retorne valor errado, apague a linha da regra, troque o valor devolvido por outro...). Uma quebra por vez.
   3. Rode só aquele teste: `npx jest -t "<nome exato do teste>"`.
   4. Registre: **sobreviveu** (continuou verde = não prova nada) ou **detectou** (ficou vermelho = bom).
   5. **Reverta:** `git checkout -- <arquivo de src>` e confirme com `git diff --stat` vazio.
4. **Corrija os que sobreviveram:** mude o teste para o valor exato esperado / código real.
   Rode o teste corrigido **sem** quebra (verde) e **com** a mesma quebra (tem que ficar vermelho). Reverta a quebra de novo.
5. **Relatório antes/depois** (formato abaixo, com saídas reais).
6. **Fechamento:** `npm run verify` verde; mostre a saída.

Se um teste detectou a quebra, deixe-o como está (isso também é resultado).
Nunca "conserte" o teste enfraquecendo outro verificador.

## Formato do relatório

```
### <nome do teste> (arquivo)
Antes:   assert <trecho>  | quebra: <o que mudei em src/...> | resultado: VERDE (sobreviveu)
Depois:  assert <trecho>  | sem quebra: VERDE | com a mesma quebra: VERMELHO (detectou)
Reversão: git diff --stat vazio
```

## Exemplo de invocação

```
Use caca-teste-inutil em src/users e src/auth e me entregue o relatório antes/depois.
```
