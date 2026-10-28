# ADR 0001: repositório em memória

## Contexto

O foco do projeto é demonstrar verificadores (lint, tipos, build, testes,
cobertura, audit), não persistência. Um banco exigiria infraestrutura no CI e
nos testes e2e.

## Decisão

`UsersRepository` guarda os usuários num array **da instância** (não de módulo).
A interface pública (`insert`, `findAll`, `findById`, `findByEmail`, `update`,
`delete`) isola o resto do código do armazenamento.

## Consequências

- Cada app de teste e2e nasce com repositório vazio: testes isolados e rápidos.
- Os dados somem ao reiniciar a API.
- Trocar por TypeORM/Prisma mexe só nessa classe, mas deixa o service
  assíncrono (ver `docs/ARQUITETURA.md`).
