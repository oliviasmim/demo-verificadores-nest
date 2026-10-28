# Testes dos cenários BDD pendentes

Aqui entram os testes dos cenários marcados como **pendentes** em
[`docs/specs/SPEC-usuarios-autenticacao.md`](../../docs/specs/SPEC-usuarios-autenticacao.md).

Regras da pasta:

- um arquivo por cenário, no formato `<slug-do-cenario>.e2e-spec.ts`;
- o nome do teste (`it(...)`) é a frase exata do `Cenário:` da spec;
- Dado / Quando / Então viram os comentários `// Dado`, `// Quando`, `// Então`;
- use `criarApp()` de `test/helpers/criar-app.ts` para ter um app limpo em cada teste.

O jest já enxerga esta pasta (`test/**/*.e2e-spec.ts`), nada a configurar.
