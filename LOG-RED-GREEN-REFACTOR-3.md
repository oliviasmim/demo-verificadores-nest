# LOG-RED-GREEN-REFACTOR — Gabarito da facilitadora / usuário não pode apagar a conta de outra pessoa

Cenário 3 de 3 do gabarito da aula 15. Saídas coladas do terminal
(stack traces encurtados com `[...]` quando muito longos).

## Cenário

```gherkin
Cenário: usuário não pode apagar a conta de outra pessoa
  Dado que Ana e Bruno estão cadastrados
  E que Bruno está autenticado
  Quando Bruno envia DELETE /users/{idAna} com o token do Bruno
  Então a resposta tem status 403
  E a conta da Ana continua existindo: GET /users/{idAna} com o token da Ana devolve 200
```

Arquivo do teste: `test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts`

## RED — o teste que ainda não passa

**Commit do teste (só o teste, nada de `src/`):**

```
e25e09b test(bdd): red — usuário não pode apagar a conta de outra pessoa (falha, esperado)
```

**Saída do terminal rodando o teste (`npx jest test/bdd/usuario`):**

```
FAIL test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts
  ● Consulta e gestão de usuários (BDD) › usuário não pode apagar a conta de outra pessoa

    expect(received).toBe(expected) // Object.is equality

    Expected: 403
    Received: 204

      47 |
      48 |     // Então a resposta tem status 403
    > 49 |     expect(resposta.status).toBe(403);
         |                             ^
      50 |
      51 |     // E a conta da Ana continua existindo: GET /users/{idAna} com o token da Ana devolve 200
      52 |     await request(app.getHttpServer())

      at Object.<anonymous> (test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts:49:29)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        0.472 s
Ran all test suites matching test/bdd/usuario.
```

**Por que esperávamos que falhasse assim:** o `DELETE /users/:id` só exige um token válido, não compara o dono do token com o id da rota. Bruno apaga a conta da Ana e recebe 204; o teste falha no comportamento do cenário (esperado 403, recebido 204), não por erro de import ou compilação.

## GREEN — o menor código que faz passar

**Commit da implementação:**

```
b088244 feat: green — só o dono da conta pode apagá-la (403 para outra pessoa)
```

**Saída do terminal com o teste do cenário passando (`npx jest test/bdd/usuario --verbose`):**

```
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.495 s, estimated 1 s
Ran all test suites matching test/bdd/usuario.
```

**Saída de `npm test` (suíte inteira, nada quebrou):**

```
> jest


Test Suites: 8 passed, 8 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        1.852 s, estimated 2 s
Ran all test suites.
```

**O que você implementou e por que é o mínimo:** No `remove` do `UsersController`, antes de apagar: se `req.user.id !== id`, lança `ForbiddenException` (403). Só o DELETE foi alterado, que é o que o teste pede.

## REFACTOR — o que você limpou (se houve)

**Commit do refactor:** não houve.

A checagem de dono existe em um único lugar (o DELETE); extraí-la para um método
ou guard agora seria abstração prematura. O ponto natural de extração é quando o
`PATCH /users/:id` também precisar dela, mas isso é **comportamento novo** (hoje
qualquer usuário autenticado edita qualquer conta; ver "Fora de escopo" na spec),
então fica como o próximo cenário, não como refactor deste.

**Confirmação:** sem refactor, nada a reconfirmar; o último `npm test` (acima) segue verde.

---

## Verificação de ordem (obrigatório)

```bash
git log --oneline -- test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts src/users/users.controller.ts
```

```
b088244 feat: green — só o dono da conta pode apagá-la (403 para outra pessoa)
e25e09b test(bdd): red — usuário não pode apagar a conta de outra pessoa (falha, esperado)
9e21ea5 refactor: extrai toPublicUser/PublicUser em vez de repetir o descarte da senha nos controllers
cca076b feat: green — respostas da API deixam de incluir o hash da senha
80510d1 feat(users): adiciona módulo de usuários com repositório em memória e CRUD
```

O `git log` lista do mais novo para o mais antigo: o commit do teste (red) aparece ABAIXO do commit da implementação (green), ou seja, é mais antigo e veio antes.
