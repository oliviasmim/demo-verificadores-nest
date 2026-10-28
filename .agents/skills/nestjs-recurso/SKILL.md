---
name: nestjs-recurso
description: Cria um recurso (módulo) NestJS completo neste repositório, com controller, service, DTOs com class-validator, repositório em memória, registro no AppModule, guard JWT e testes unit + e2e. Use quando o pedido for criar um novo recurso, módulo ou CRUD (ex.: "crie o recurso tarefas", "adicione um módulo de projetos").
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run *), Bash(npx jest *), Bash(npx eslint *)
---

# Criar um recurso NestJS

## O que ela faz

Gera um módulo novo seguindo as convenções do repositório: `module`,
`controller`, `service`, `dto/`, `repository` em memória, registro no
`AppModule`, rotas protegidas por `JwtAuthGuard`, e os testes (unit do service
e do repositório, e2e das rotas). Esqueletos prontos em
[reference.md](reference.md).

## Quando ela dispara (e quando não deveria)

- Dispara: "crie o recurso `tarefas` com título e status".
- Não dispara: "adicione o campo `telefone` ao usuário" (é mudança em recurso
  existente: use só as convenções do `AGENTS.md` e a skill `nestjs-testes`).
- Não dispara: "implemente o cenário X da spec" (use `bdd-para-teste`).

## Passos

1. Leia `src/users/` inteiro: é o modelo de referência (estrutura, nomes, estilo).
2. **Teste primeiro.** Escreva o e2e do comportamento principal em
   `test/<recurso>.e2e-spec.ts` (usa `criarApp()`), rode e confirme que falha
   porque a rota ainda não existe (404), não por erro de sintaxe.
3. Crie a pasta `src/<recurso>/` com: `<recurso>.entity.ts`, `dto/create-<recurso>.dto.ts`,
   `dto/update-<recurso>.dto.ts`, `<recurso>.repository.ts`, `<recurso>.service.ts`,
   `<recurso>.controller.ts`, `<recurso>.module.ts`.
4. DTOs com `class-validator` (`@IsString`, `@MinLength`, `@IsOptional`...). O
   `ValidationPipe` global (`configureApp`) já usa `whitelist` e `forbidNonWhitelisted`.
5. Repositório em memória com o estado **na instância** (`private readonly itens: T[] = []`),
   nunca em variável de módulo.
6. Service com a regra e exceções HTTP do Nest (`NotFoundException`...).
7. Controller com `@UseGuards(JwtAuthGuard)` na classe. Em recurso de outra
   pessoa, aplique checagem de dono (ver skill `nestjs-auth-jwt`).
8. Registre o módulo em `src/app.module.ts` (`imports`). O `JwtAuthGuard` usa a
   `JwtStrategy` do `AuthModule`; não reimporte nada de auth se o guard já funciona.
9. Escreva os testes unit do service e do repositório (`*.spec.ts` ao lado do código).
10. Rode `npm run verify` e mostre a saída (skill `verificar-antes-de-pronto`).

## Exemplo de invocação

```
Crie o recurso "tarefas" (titulo obrigatório, concluida opcional, rotas protegidas).
```

Resultado esperado: `src/tarefas/*`, `test/tarefas.e2e-spec.ts`, `AppModule`
atualizado e `npm run verify` verde com a saída colada na resposta.
