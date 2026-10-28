# Entrega — Aula 15 (Verificadores): gabarito da facilitadora

Autor: Gabarito da facilitadora. Este arquivo mapeia o que foi entregue para o
checklist do `ENTREGAVEL.md` da aula 15. Branch: `gabarito`.

## Checklist

| Item do checklist | Situação | Onde está |
|---|---|---|
| `package.json` com `lint`, `typecheck`, `build`, `test` (e `verify`) | feito | `package.json` (também `test:cov` e `audit`) |
| `.github/workflows/ci.yml` commitado e rodando | feito | `.github/workflows/ci.yml`: jobs Lint, Type check, Build, Test (com cobertura), Dependency check (npm audit) e dependency-review |
| Branch protection exigindo os status checks | configurada no repo `oliviasmim/demo-verificadores-nest`; **print a capturar ao vivo** | Settings > Branches > regra da `main` |
| Print do merge bloqueado | **a capturar ao vivo** (ver branch `demo/pr-quebrado`, que quebra login e lint de propósito) | PR da `demo/pr-quebrado` para `main` |
| 3 testes, um por cenário, nomeados com a frase | feito | `test/bdd/*.e2e-spec.ts` (tabela abaixo) |
| 3 logs `LOG-RED-GREEN-REFACTOR-<n>.md` com `git log` | feito | raiz do repo |
| 1 teste que não prova nada, documentado e corrigido | feito (dois, não um) | `TESTE-QUE-NAO-PROVA-NADA.md` |
| `npm audit` local e no CI sem high/critical | feito | seção "npm audit" abaixo |
| Parágrafo para o dono do negócio | feito | abaixo |
| Parágrafo extra (qual sensor salva mais) | feito | abaixo |

## Os 3 cenários: hashes para a descrição do PR

| # | Cenário (nome do teste) | Arquivo do teste | RED | GREEN | REFACTOR | Log |
|---|---|---|---|---|---|---|
| 1 | cadastro com e-mail já cadastrado é recusado | `test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts` | `4c62fd8` | `6f9e77d` | não houve | `LOG-RED-GREEN-REFACTOR-1.md` |
| 2 | a senha nunca aparece nas respostas da API | `test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts` | `103da73` | `cca076b` | `9e21ea5` | `LOG-RED-GREEN-REFACTOR-2.md` |
| 3 | usuário não pode apagar a conta de outra pessoa | `test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts` | `e25e09b` | `b088244` | não houve | `LOG-RED-GREEN-REFACTOR-3.md` |

Cada RED foi commitado falhando pelo motivo do cenário (esperado 409 e recebido
201; hash da senha vazando em 5 rotas; esperado 403 e recebido 204) antes de
qualquer linha de `src/` ser tocada. A ordem está provada no `git log` colado em
cada log.

Os cenários 1 e 3 não tiveram refactor porque não havia o que limpar de forma
genuína. No cenário 3, estender a checagem de dono ao `PATCH` é comportamento
novo e fica como próximo cenário (já listado em "Fora de escopo" da spec).

## Teste que não prova nada

Dois plantados no projeto, ambos provados e corrigidos em
`TESTE-QUE-NAO-PROVA-NADA.md`:

| Teste | Padrão | Quebra aplicada | Antes | Depois | Commit da correção |
|---|---|---|---|---|---|
| `cria usuário com senha protegida` (`users.service.spec.ts`) | 3: assert que não verifica o valor (`toBeDefined`) | salvar a senha em texto puro | verde | vermelho | `3b200e1` |
| `login retorna token` (`auth.service.spec.ts`) | 1: testa o mock, não o código | `login` recusa todo mundo | verde | vermelho | `cbae182` |

## npm audit

`npm audit --audit-level=high` (o que o CI e o `npm run verify` rodam) termina
com **código 0**: nenhuma vulnerabilidade high ou critical. O resumo real é:

```
8 low severity vulnerabilities
```

- **Override do multer.** O `npm audit` apontou um **high** no `multer` 2.4.0
  (DoS, GHSA-q7qp-rjg7-q26m), dependência transitiva do
  `@nestjs/platform-express` 11.2.8. A correção existe na 2.5.0, então o
  `package.json` tem `"overrides": { "multer": "^2.5.0" }`. É uma correção, não um
  silenciamento: `npm ls multer` mostra `multer@2.5.0`. Quando o Nest publicar
  uma versão que já use multer 2.5 ou mais novo, o override pode sair.
- **8 low em devDependencies.** Todas vêm de `deepmerge` (prototype poisoning,
  GHSA-gcqx-w48m-w2h4) via `jest-config` e `@nestjs/cli`. Ficam abaixo do corte
  `high` do CI, só existem em ferramentas de desenvolvimento (não vão para a
  imagem de produção) e a correção automática exigiria um downgrade para
  `@nestjs/cli@7.2.0`, que é pior. Decisão justificada por escrito no README
  (seção "Auditoria de dependências").

## `npm run verify` no final (branch `gabarito`)

Resultado: **verde, código de saída 0.**

```
lint        ok (eslint, sem --fix)
typecheck   ok (tsc --noEmit)
build       ok (nest build)
test:cov    Test Suites: 8 passed, 8 total
            Tests:       43 passed, 43 total
            Statements : 99.21% ( 127/128 )
            Branches   : 82.81% ( 53/64 )
            Functions  : 100% ( 34/34 )
            Lines      : 99.08% ( 108/109 )
            (piso global de 80% mantido, sem alterar o threshold)
audit       8 low severity vulnerabilities, 0 high/critical (exit 0)
```

## Parágrafo para o dono do negócio

Nosso sistema de cadastro e login de usuários agora tem uma trava automática: antes de qualquer
mudança ir para o ar, o computador confere sozinho se o cadastro ainda recusa e-mail repetido, se
ninguém consegue ver a senha de outra pessoa e se um usuário não consegue apagar a conta de outro.
Se qualquer uma dessas conferências falhar, a publicação é bloqueada até alguém corrigir; não é um
aviso que dá para ignorar, é uma porta trancada. Isso é diferente de confiar que alguém (ou uma
inteligência artificial) vai lembrar de testar: lembrar depende de atenção num dia corrido, e a
trava não esquece nem cansa. O resultado prático é que um erro que exporia os dados dos nossos
usuários é barrado antes de chegar a eles.

## Parágrafo extra: qual dos 5 sensores salva mais vezes neste domínio

Neste domínio, de cadastro e login, eu apostaria no **teste automatizado de comportamento (os
cenários BDD de segurança)**, com o `npm audit` em segundo lugar. Lint, tipos e build pegam código
que está malformado, mas os piores erros de um sistema de login são código perfeitamente bem
formado que faz a coisa errada: aceitar senha errada, devolver o hash da senha numa resposta,
deixar um usuário apagar a conta do outro. Nenhum desses erros dá aviso de lint nem erro de
compilação, e a prova está neste repositório: os três cenários que implementamos estavam todos com
build verde, e a branch `demo/pr-quebrado` quebra o login mantendo tipos e build verdes. Só um
teste que exercita o comportamento esperado (e que, como mostramos, foi visto falhando antes de
passar e é capaz de falhar quando a implementação quebra) enxerga isso. A ressalva é que o
teste só protege o que alguém pensou em escrever: por isso o `npm audit` fica em segundo, já que
cobre o risco que ninguém escreveu cenário para, as vulnerabilidades conhecidas das bibliotecas
(o `multer` high deste projeto é o exemplo).
