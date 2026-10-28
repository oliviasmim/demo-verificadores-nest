# LOG-RED-GREEN-REFACTOR — Gabarito da facilitadora / cadastro com e-mail já cadastrado é recusado

Cenário 1 de 3 do gabarito da aula 15. Saídas coladas do terminal
(stack traces encurtados com `[...]` quando muito longos).

## Cenário

```gherkin
Cenário: cadastro com e-mail já cadastrado é recusado
  Dado que "ana@pda.org" já está cadastrada
  Quando envio POST /auth/register com nome "Outra Ana", e-mail "ana@pda.org" e senha "senha12345"
  Então a resposta tem status 409
  E existe apenas 1 usuário com o e-mail "ana@pda.org"
```

Arquivo do teste: `test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts`

## RED — o teste que ainda não passa

**Commit do teste (só o teste, nada de `src/`):**

```
4c62fd8 test(bdd): red — cadastro com e-mail já cadastrado é recusado (falha, esperado)
```

**Saída do terminal rodando o teste (`npx jest test/bdd/cadastro`):**

```
FAIL test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts
  ● Cadastro e login de usuários (BDD) › cadastro com e-mail já cadastrado é recusado

    expect(received).toBe(expected) // Object.is equality

    Expected: 409
    Received: 201

      38 |
      39 |     // Então a resposta tem status 409
    > 40 |     expect(resposta.status).toBe(409);
         |                             ^
      41 |
      42 |     // E existe apenas 1 usuário com o e-mail "ana@pda.org"
      43 |     const lista = await request(app.getHttpServer())

      at Object.<anonymous> (test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts:40:29)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        0.558 s
Ran all test suites matching test/bdd/cadastro.
```

**Por que esperávamos que falhasse assim:** o `UsersService.create` não verifica se o e-mail já existe, então o segundo cadastro é aceito (201) e o teste falha exatamente no comportamento do cenário (esperado 409, recebido 201), não por erro de import ou compilação.

## GREEN — o menor código que faz passar

**Commit da implementação:**

```
6f9e77d feat: green — recusa cadastro com e-mail já cadastrado (409 Conflict)
```

**Saída do terminal com o teste do cenário passando (`npx jest test/bdd/cadastro --verbose`):**

```
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.499 s, estimated 1 s
Ran all test suites matching test/bdd/cadastro.
```

**Saída de `npm test` (suíte inteira, nada quebrou):**

```
> jest


Test Suites: 6 passed, 6 total
Tests:       41 passed, 41 total
Snapshots:   0 total
Time:        2.247 s
Ran all test suites.
```

**O que você implementou e por que é o mínimo:** Uma checagem de 3 linhas em `UsersService.create`: se `repository.findByEmail` já devolve alguém, lança `ConflictException` (HTTP 409). Nada de normalizar maiúsculas/minúsculas ou índice único: o teste não pede isso.

## REFACTOR — o que você limpou (se houve)

**Commit do refactor:** não houve.

Não havia o que limpar de forma genuína: a mudança do green tem 3 linhas e
reaproveita `findByEmail`, que já existia. Normalizar o e-mail (caixa alta/baixa)
seria comportamento novo, então fica como candidato a cenário seguinte. Os
testes continuam verdes (ver saída do `npm test` acima).

**Confirmação:** sem refactor, nada a reconfirmar; o último `npm test` (acima) segue verde.

---

## Verificação de ordem (obrigatório)

```bash
git log --oneline -- test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts src/users/users.service.ts
```

```
6f9e77d feat: green — recusa cadastro com e-mail já cadastrado (409 Conflict)
4c62fd8 test(bdd): red — cadastro com e-mail já cadastrado é recusado (falha, esperado)
80510d1 feat(users): adiciona módulo de usuários com repositório em memória e CRUD
```

O `git log` lista do mais novo para o mais antigo: o commit do teste (red) aparece ABAIXO do commit da implementação (green), ou seja, é mais antigo e veio antes.
