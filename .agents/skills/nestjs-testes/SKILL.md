---
name: nestjs-testes
description: Escreve testes neste repositório NestJS com Jest (unit) e supertest (e2e), com isolamento e asserts de valor exato, evitando testes que não provam nada. Use quando o pedido for escrever, corrigir ou revisar testes, ou aumentar cobertura.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run *), Bash(npx jest *), Bash(npx eslint *)
---

# Escrever testes neste repo

## O que ela faz

Padroniza como testar: unit com Jest para service/repositório, e2e com
`supertest` contra o `AppModule` real, sempre isolado e com asserts que podem
falhar. Complementa [`docs/TESTES.md`](../../../docs/TESTES.md).

## Quando ela dispara (e quando não deveria)

- Dispara: "escreva testes para o service", "esse teste está fraco", "suba a cobertura".
- Não dispara: "transforme este cenário Gherkin em teste" (use `bdd-para-teste`);
  "ache testes inúteis em massa" (use `caca-teste-inutil`).

## Passos

1. Escolha a camada: regra de uma classe isolada é **unit** (`src/**/*.spec.ts`,
   `new Service(new Repositorio())`); contrato HTTP (status, guard, validação) é **e2e** (`test/*.e2e-spec.ts`).
2. Nome do teste em pt-BR, descrevendo o comportamento ("recusa senha errada com mensagem genérica").
3. **Unit:**

```ts
describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(new UsersRepository()); // instância nova por teste
  });

  it('lança NotFoundException ao buscar id inexistente', () => {
    expect(() => service.findOne('nao-existe')).toThrow(NotFoundException);
  });
});
```

4. **e2e:** `criarApp()` (usa `configureApp`, então valida como o app real) em
   `beforeEach`, `app.close()` em `afterEach`:

```ts
import request from 'supertest';
import { criarApp } from './helpers/criar-app';

let app: INestApplication<App>;
beforeEach(async () => { app = await criarApp(); });
afterEach(async () => { await app.close(); });

it('listar usuários sem token é recusado', async () => {
  await request(app.getHttpServer()).get('/users').expect(401);
});
```

5. **Isolamento:** nunca compartilhe app, repositório ou dados entre testes.
6. **Asserts com valor exato:** `toBe('Ana')`, `toEqual([...])`,
   `expect(res.body.message).toBe('Credenciais inválidas')`. Para exceções,
   `rejects.toThrow(new UnauthorizedException('Credenciais inválidas'))`.
7. Teste o caso feliz **e** o de erro (400, 401, 403, 404).
8. **Prove que o teste detecta quebra:** quebre a implementação, rode
   `npx jest -t "<nome>"`, veja falhar, reverta (skill `caca-teste-inutil`).
9. Rode `npm run verify`.

## Anti-padrões (teste verde que não prova nada)

1. **Testa o mock, não o código:** o teste cria um objeto falso e verifica o próprio objeto falso; a classe real nunca é importada.
   Correção: instancie o service real e use fake só na dependência externa.
2. **Assert que sempre passa:** `expect(x || !x).toBe(true)`, ou assert dentro de
   callback que o teste não espera (sem `await`/`done`), ou `expect(...)` sem matcher.
   Correção: compare contra valor específico e espere a operação terminar.
3. **Cobertura sem verificação:** executa a função, mas o assert só confirma que
   "existe algo" (`toBeDefined`, `toBeTruthy`, `not.toBeNull`).
   Correção: assert do valor exato, e checagem de pelo menos uma propriedade que muda com a regra.

Proibido: `.only`, `.skip`, `xit`, `xdescribe`; baixar `coverageThreshold`;
trocar o valor esperado só para ficar verde.

## Exemplo de invocação

```
Escreva os testes unit do TarefasService e o e2e de criar tarefa.
```
