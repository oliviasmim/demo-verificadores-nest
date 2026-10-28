# Testes

## Pirâmide do projeto

| Camada | Onde | Para que serve | Como é montada |
|---|---|---|---|
| Unit | `src/**/*.spec.ts` | Uma classe isolada (service, repositório) | `new UsersService(new UsersRepository())`, sem Nest |
| e2e | `test/*.e2e-spec.ts` | A API inteira via HTTP, com guard, pipe e módulos reais | `criarApp()` + `supertest` |
| BDD | `test/bdd/<slug>.e2e-spec.ts` | Um cenário de `docs/specs/features/*.feature` | igual ao e2e |

Regras do BDD (detalhes em [`test/bdd/README.md`](../test/bdd/README.md)):

- **um arquivo por cenário**; o nome do arquivo é o slug do cenário;
- o nome do `it(...)` é a **frase exata** do `Cenário:`;
- Dado / Quando / Então viram os comentários `// Dado`, `// Quando`, `// Então`;
- use `criarApp()` de `test/helpers/criar-app.ts` (app novo, repositório vazio, por teste).

Nomes de testes e de variáveis de domínio em português do Brasil.

## Como rodar

```bash
npm test                          # tudo (unit + e2e + bdd), sem cobertura
npm run test:cov                  # com cobertura e piso de 80%
npx jest src/users                # só uma pasta
npx jest -t "nome do teste"       # só um teste pelo nome
npx jest test/bdd                 # só os cenários BDD
```

## Piso de cobertura

`jest.coverageThreshold.global` no `package.json`: 80% de statements,
branches, functions e lines. Fora da medição: `main.ts`, `*.module.ts`, DTOs e
os próprios specs. **Nunca baixe o piso para passar**; um hook pede
confirmação se alguém tentar.

Cobertura mede o que **executou**, não o que foi **verificado**. Um teste pode
passar por todas as linhas e não provar nada.

## Como checar "teste que não prova nada"

Teste verde só vale se ele **ficaria vermelho** com o código quebrado.

1. Escolha um teste e a implementação que ele deveria proteger.
2. Quebre a implementação de propósito (retorne um valor errado, remova uma
   linha da regra).
3. Rode só aquele teste: `npx jest -t "<nome do teste>"`.
4. Continuou verde? Ele não prova nada. Corrija e prove que o corrigido falha
   com a mesma quebra.
5. **Reverta** a quebra (`git checkout -- <arquivo>`) e rode de novo: tem que
   voltar a ficar verde.

Os três padrões mais comuns: o teste verifica o mock em vez do código real; o
assert nunca falha (tautologia ou assert num callback que não é esperado); o
assert só confirma que "existe algo" (`toBeDefined`, truthy) em vez do valor
exato. A skill `caca-teste-inutil` automatiza esse procedimento.

## Convenções

- Um app novo por teste (`beforeEach` + `afterEach(app.close)`): nunca compartilhe estado.
- Assert com valor exato (`toBe('Ana')`, `toEqual([...])`), não `toBeDefined()`.
- Teste de comportamento, não de implementação.
- Nada de `.only`, `.skip`, `xit` (um hook bloqueia).
