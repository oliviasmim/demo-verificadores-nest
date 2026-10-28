# Verificadores

Ideia central: **o agente (ou a pessoa) não diz "pronto" sem um sinal que não
seja a palavra dele.** Os verificadores são esses sinais. O CI roda os mesmos
que `npm run verify` roda localmente.

## Os 5 sensores do CI

| Sensor | Script | O que pega | O que NÃO pega |
|---|---|---|---|
| Lint | `npm run lint` | estilo, bugs comuns, promessa esquecida, `any` perigoso | lógica errada, regra de negócio |
| Type check | `npm run typecheck` | tipos incompatíveis, inclusive nos testes | valor errado com tipo certo |
| Build | `npm run build` | código que não compila/empacota | comportamento |
| Testes + cobertura | `npm run test:cov` | regressão; código que nenhum teste executa (piso 80%) | teste que não verifica nada; cenário que ninguém escreveu |
| Dependency check | `npm run audit` | vulnerabilidade high/critical conhecida em dependência | pacote inventado/malicioso novo, vulnerabilidade ainda não publicada, moderate/low |

No CI há ainda a `dependency-review` (só em PR), que compara as dependências
adicionadas pelo PR. `npm run verify` encadeia os cinco sensores, na ordem do
quadro.

Nenhum sensor lê a **spec**. Cenário BDD sem teste não faz nenhum deles
falhar: é preciso procurar (ver `docs/specs/`) e escrever o teste.

## Scripts

```bash
npm run lint        # eslint "{src,test}/**/*.ts"  (SEM --fix)
npm run lint:fix    # só uso local
npm run typecheck   # tsc --noEmit -p tsconfig.json
npm run build       # nest build
npm run test:cov    # jest --coverage (threshold global 80%)
npm run audit       # npm audit --audit-level=high
npm run verify      # todos, em sequência
npm run agents:test-hooks   # testa os hooks do setup de IA
```

## Por que lint sem `--fix`

No CI, `--fix` corrige o arquivo no runner e o job passa, escondendo o
problema que continua no código commitado. Sensor reporta, não conserta. Ver
[ADR 0003](./adr/0003-lint-sem-fix-no-ci.md).

## Verificadores locais do agente (hooks)

Em `.claude/settings.json` (scripts em `.agents/hooks/`):

- `proteger-verificadores`: pede confirmação para enfraquecer um sensor
  (baixar cobertura, mexer no CI/ESLint, `eslint-disable`) e nega `.only`/`.skip`;
- `bloquear-comandos-perigosos`: nega `--no-verify`, `push --force`, push na
  `main`, `npm audit fix --force`; pergunta antes de instalar pacote novo;
- `lint-no-arquivo-editado`: ESLint no arquivo recém-editado;
- `nao-diga-pronto-sem-prova`: ao terminar, roda lint, typecheck e jest se
  houve mudança em `src/` ou `test/`.

Hook é determinístico: o agente não "esquece" dele como esquece uma instrução.
