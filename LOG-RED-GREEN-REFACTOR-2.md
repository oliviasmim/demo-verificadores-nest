# LOG-RED-GREEN-REFACTOR — Gabarito da facilitadora / a senha nunca aparece nas respostas da API

Cenário 2 de 3 do gabarito da aula 15. Saídas coladas do terminal
(stack traces encurtados com `[...]` quando muito longos).

## Cenário

```gherkin
Cenário: a senha nunca aparece nas respostas da API
  Dado que Ana está cadastrada e autenticada
  Quando envio GET /users/{idAna} com o token da Ana
  Então a resposta tem status 200
  E o corpo não contém o campo "password"
  E o corpo não contém o campo "passwordHash"
```

Arquivo do teste: `test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts`

## RED — o teste que ainda não passa

**Commit do teste (só o teste, nada de `src/`):**

```
103da73 test(bdd): red — a senha nunca aparece nas respostas da API (falha, esperado)
```

**Saída do terminal rodando o teste (`npx jest test/bdd/a-senha`):**

```
FAIL test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts
  ● Consulta e gestão de usuários (BDD) › a senha nunca aparece nas respostas da API

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 7

    - Array []
    + Array [
    +   "POST /auth/register -> passwordHash",
    +   "GET /users/:id -> passwordHash",
    +   "GET /users -> passwordHash",
    +   "GET /users/me -> passwordHash",
    +   "PATCH /users/:id -> passwordHash",
    + ]

      76 |       ...vazamentos('GET /users/me', eu.body),
      77 |       ...vazamentos('PATCH /users/:id', atualizado.body),
    > 78 |     ]).toEqual([]);
         |        ^
      79 |   });
      80 | });
      81 |

      at Object.<anonymous> (test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts:78:8)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        0.437 s
Ran all test suites matching test/bdd/a-senha.
```

**Por que esperávamos que falhasse assim:** hoje os controllers devolvem o objeto `User` inteiro, inclusive `passwordHash`. O teste cobre as 5 rotas que devolvem usuário (POST /auth/register, GET /users, GET /users/:id, GET /users/me e PATCH /users/:id) e a falha lista exatamente onde o hash vazou, não um erro de import ou compilação.

## GREEN — o menor código que faz passar

**Commit da implementação:**

```
cca076b feat: green — respostas da API deixam de incluir o hash da senha
```

**Saída do terminal com o teste do cenário passando (`npx jest test/bdd/a-senha --verbose`):**

```
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.444 s, estimated 1 s
Ran all test suites matching test/bdd/a-senha.
```

**Saída de `npm test` (suíte inteira, nada quebrou):**

```
> jest


Test Suites: 7 passed, 7 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        1.794 s, estimated 2 s
Ran all test suites.
```

**O que você implementou e por que é o mínimo:** Uma função `semSenha` em cada controller (a de `/users` e a de `/auth`) que copia o usuário e apaga `passwordHash`, aplicada nas 5 rotas. Ficou duplicada de propósito: é o jeito mais curto de deixar o teste verde; a limpeza é o refactor.

## REFACTOR — o que você limpou (se houve)

**Commit do refactor:**

```
9e21ea5 refactor: extrai toPublicUser/PublicUser em vez de repetir o descarte da senha nos controllers
```

**O que mudou e por que o comportamento continua o mesmo:** as duas cópias de
`semSenha` viraram uma só, `toPublicUser` (com o tipo `PublicUser = Omit<User, 'passwordHash'>`),
em `src/users/public-user.ts`. Os controllers passam a declarar `PublicUser` como retorno,
então o compilador também ajuda a não devolver o `User` cru. A lógica é a mesma
(copiar e apagar `passwordHash`); o teste do cenário e a suíte inteira seguem verdes.

Saída do `npm test` e do teste do cenário depois do refactor:

```
> jest


Test Suites: 7 passed, 7 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        1.824 s, estimated 2 s
Ran all test suites.
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.396 s, estimated 1 s
Ran all test suites matching test/bdd/a-senha.
```

**Confirmação:** `npm test` rodado de novo depois do refactor — ainda verde? `[x] sim` `[ ] não, e por isso eu desfiz`

**Próximo cenário (não feito aqui):** um `ClassSerializerInterceptor` com `@Exclude()` na entidade
tornaria a regra automática para rotas novas, mas exige o repositório guardar instâncias de classe;
é uma mudança de desenho, não um refactor.

---

## Verificação de ordem (obrigatório)

```bash
git log --oneline -- test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts src/users/public-user.ts src/users/users.controller.ts src/auth/auth.controller.ts
```

```
9e21ea5 refactor: extrai toPublicUser/PublicUser em vez de repetir o descarte da senha nos controllers
cca076b feat: green — respostas da API deixam de incluir o hash da senha
103da73 test(bdd): red — a senha nunca aparece nas respostas da API (falha, esperado)
cb54c5f feat(auth): adiciona cadastro, login e proteção de rotas com JWT
80510d1 feat(users): adiciona módulo de usuários com repositório em memória e CRUD
```

O `git log` lista do mais novo para o mais antigo: o commit do teste (red) aparece ABAIXO do commit da implementação (green), ou seja, é mais antigo e veio antes.
