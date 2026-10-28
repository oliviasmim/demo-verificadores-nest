# Testes que não provam nada — dois encontrados e corrigidos

Autor: Gabarito da facilitadora. O projeto tinha dois testes verdes que não
detectavam quebra nenhuma. Para cada um: padrão identificado, prova de que ele
não pega a quebra, correção, prova de que o teste corrigido pega a quebra e
saída verde final. Padrões do `aula15-verificadores/starter/teste-que-nao-prova-nada-exemplos.md`.

Método (igual nos dois): **quebrar a implementação de propósito, rodar só aquele
teste e ver o que acontece.** A quebra é sempre revertida (`git checkout`) antes
de seguir; nenhuma quebra foi commitada.

---

## 1. `cria usuário com senha protegida` (`src/users/users.service.spec.ts`)

**Padrão 3 — o assert que não verifica o valor.** `toBeDefined()` só diz que o
campo existe; qualquer coisa serve: o hash, a senha em texto puro, até uma string
vazia.

### Antes

```ts
it('cria usuário com senha protegida', async () => {
  const user = await service.create(dadosAna);

  expect(user.passwordHash).toBeDefined();
});
```

### A quebra aplicada

Em `UsersService.create`, salvar a senha em texto puro (o pior bug possível neste domínio):

```diff
-    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
+    const passwordHash = dto.password; // QUEBRA DE PROPÓSITO: senha em texto puro
```

### Saída com a quebra aplicada: continua VERDE (o teste não prova nada)

```
Test Suites: 1 passed, 1 total
Tests:       11 skipped, 1 passed, 12 total
Snapshots:   0 total
Time:        0.163 s, estimated 1 s
Ran all test suites matching src/users/users.service.spec with tests matching "cria usuário com senha protegida".
```

### Depois

```ts
import * as bcrypt from 'bcryptjs';
// ...
it('cria usuário com senha protegida', async () => {
  const user = await service.create(dadosAna);

  // Nunca em texto puro...
  expect(user.passwordHash).not.toBe(dadosAna.password);
  // ...e é um hash bcrypt que confere com a senha original (e só com ela).
  expect(await bcrypt.compare(dadosAna.password, user.passwordHash)).toBe(true);
  expect(await bcrypt.compare('outra-senha', user.passwordHash)).toBe(false);
});
```

### Saída com a MESMA quebra e o teste corrigido: VERMELHO

```
FAIL src/users/users.service.spec.ts
  ● UsersService › cria usuário com senha protegida

    expect(received).not.toBe(expected) // Object.is equality

    Expected: not "senha12345"

      21 |
      22 |     // Nunca em texto puro...
    > 23 |     expect(user.passwordHash).not.toBe(dadosAna.password);
         |                                   ^
      24 |     // ...e é um hash bcrypt que confere com a senha original (e só com ela).
      25 |     expect(await bcrypt.compare(dadosAna.password, user.passwordHash)).toBe(
      26 |       true,

      at Object.<anonymous> (src/users/users.service.spec.ts:23:35)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 11 skipped, 12 total
Snapshots:   0 total
Time:        0.16 s, estimated 1 s
Ran all test suites matching src/users/users.service.spec with tests matching "cria usuário com senha protegida".
```

### Quebra revertida: VERDE final (arquivo inteiro)

```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        0.953 s, estimated 1 s
Ran all test suites matching src/users/users.service.spec.
```

Commit: ver `git log` (mensagem `test: corrige teste que não provava nada (cria usuário com senha protegida)`).

---

## 2. `login retorna token` (`src/auth/auth.service.spec.ts`)

**Padrão 1 — o teste testa o mock, não o código.** O teste criava um objeto
`authService` falso dentro do próprio teste, chamava o falso e conferia o que o
falso devolve. O `AuthService` real nunca era executado.

### Antes

```ts
it('login retorna token', async () => {
  const authService = {
    login: () => Promise.resolve({ access_token: 'token-falso' }),
  };

  const resultado = await authService.login();

  expect(resultado.access_token).toBe('token-falso');
});
```

### A quebra aplicada

Em `AuthService.login`, recusar todo mundo (ninguém consegue entrar):

```diff
+    // QUEBRA DE PROPÓSITO: login sempre recusa, ninguém entra
+    if (dto) throw new UnauthorizedException('Credenciais inválidas');
```

### Saída com a quebra aplicada: continua VERDE (o teste não prova nada)

```
Test Suites: 1 passed, 1 total
Tests:       4 skipped, 1 passed, 5 total
Snapshots:   0 total
Time:        0.189 s, estimated 1 s
Ran all test suites matching src/auth/auth.service.spec with tests matching "login retorna token".
```

### Depois

Usa o `AuthService` real, com dependências reais (`UsersService` + repositório em
memória) e o `JwtService` real com segredo de teste; confere que o token é um JWT
válido assinado por esse segredo.

```ts
it('login retorna token', async () => {
  await service.register(ana);

  const resultado = await service.login({
    email: ana.email,
    password: ana.password,
  });

  // Um JWT de verdade (3 partes) e assinado com o segredo do JwtService real
  expect(resultado.access_token.split('.')).toHaveLength(3);
  await expect(
    jwtService.verifyAsync(resultado.access_token),
  ).resolves.toBeDefined();
});
```

### Saída com a MESMA quebra e o teste corrigido: VERMELHO

```
FAIL src/auth/auth.service.spec.ts
  ● AuthService › login retorna token

    UnauthorizedException: Credenciais inválidas

      20 |   async login(dto: LoginDto): Promise<{ access_token: string }> {
      21 |     // QUEBRA DE PROPÓSITO: login sempre recusa, ninguém entra
    > 22 |     if (dto) throw new UnauthorizedException('Credenciais inválidas');
         |                    ^
      23 |     const user = this.usersService.findByEmail(dto.email);
      24 |     const senhaConfere =
      25 |       user !== undefined &&

      at AuthService.login (src/auth/auth.service.ts:22:20)
      at Object.<anonymous> (src/auth/auth.service.spec.ts:24:37)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 4 skipped, 5 total
Snapshots:   0 total
Time:        0.243 s, estimated 1 s
Ran all test suites matching src/auth/auth.service.spec with tests matching "login retorna token".
```

### Quebra revertida: VERDE final (arquivo inteiro)

```
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.566 s, estimated 1 s
Ran all test suites matching src/auth/auth.service.spec.
```

Commit: ver `git log` (mensagem `test: corrige teste que não provava nada (login retorna token)`).

---

## Lição

Um teste verde só vale se existir uma quebra que o deixaria vermelho. Antes de
confiar num teste (seu ou de agente), pergunte: "que mudança no código faria isso
falhar?" e **faça** essa mudança. Se nada falha, o teste é decoração.
