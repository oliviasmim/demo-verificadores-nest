# ADR 0003: lint sem `--fix` no CI

## Contexto

Com `eslint --fix`, o runner do CI corrige o arquivo em memória e o job passa,
mas o código commitado continua com o problema. O sensor mentiria.

## Decisão

`npm run lint` roda `eslint "{src,test}/**/*.ts"` **sem** `--fix`; é o que o CI
e o `npm run verify` usam. `npm run lint:fix` existe só para uso local. O hook
de lint do agente também não usa `--fix`.

## Consequências

- Falha de lint derruba o job: a pessoa (ou o agente) precisa corrigir.
- Mais um passo local (`npm run lint:fix`) antes do commit quando há estilo a ajustar.
