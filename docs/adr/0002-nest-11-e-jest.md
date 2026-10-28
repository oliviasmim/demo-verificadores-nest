# ADR 0002: NestJS 11 e Jest

## Contexto

O Nest 12 migrou para ESM, vitest e oxlint. `@nestjs/jwt` e `@nestjs/passport`
acompanham a mesma versão maior do Nest. O curso precisa de uma base que rode
Jest e ESLint sem configuração extra.

## Decisão

Usar NestJS 11 (CommonJS) com Jest 30, ts-jest, supertest e ESLint 9 (flat
config) com typescript-eslint.

## Consequências

- Setup conhecido e estável para os alunos.
- Migrar para o Nest 12 será uma decisão futura, com novo ADR.
- Specs unitárias ficam ao lado do código (`*.spec.ts`); e2e em `test/`.
