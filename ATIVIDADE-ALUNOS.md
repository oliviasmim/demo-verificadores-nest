# Atividade prática: verificadores de ponta a ponta num projeto NestJS

Nesta atividade você faz, num projeto de verdade, **cada passo do
`ENTREGAVEL.md` da aula 15 (Verificadores)**. O projeto é uma API NestJS de
usuários com cadastro, login, senha com hash e JWT. Ele parece "pronto": tem CI
verde, 40 testes e 100% de cobertura de linha.

Sua missão é descobrir se dá para confiar nesse "pronto" e, se não der,
**provar com sensores** (testes, CI e branch protection) o que estava errado.

| | |
| :-- | :-- |
| **Repositório original** | https://github.com/oliviasmim/demo-verificadores-nest |
| **Seu repositório** | um fork **público** dele na sua conta (`SEU-USUARIO/demo-verificadores-nest`) |
| **Spec (EARS + BDD)** | `docs/specs/SPEC-usuarios-autenticacao.md` e `docs/specs/features/*.feature` |
| **Postman** | `postman/demo-verificadores.postman_collection.json` e `postman/local.postman_environment.json` |
| **Tempo estimado** | 2h a 3h (entrega mínima: ~1h30) |

> **Objetivo final:** no **seu fork** você vai ter:
> 1. um CI que bloqueia merge de verdade;
> 2. o print de um PR quebrado que **não pôde** ser mesclado;
> 3. cenários BDD da spec virados em teste, com o `git log` provando que o
>    teste veio **antes** do código;
> 4. um "teste que não prova nada" encontrado e corrigido;
> 5. um PR verde com tudo isso, mais o parágrafo para o dono do negócio.

Em todo este guia, troque `SEU-USUARIO` pelo seu usuário do GitHub.

---

## Sumário

- Parte A: instalação e preparação (30 min)
- Passo 0: o "pronto" que não está pronto (10 min)
- Passo 1: os scripts do `package.json` (10 min)
- Passos 2 e 3: o CI rodando (10 min)
- Passo 4: branch protection (10 min)
- Passo 5: provar o bloqueio (15 min)
- Passo 6: BDD vira teste, com red, green e refactor (30 a 60 min)
- Passo 7: o teste que não prova nada (20 min)
- Passos 8 e 9: parágrafo, `ENTREGA.md` e PR (15 min)
- Bônus: os verificadores dentro do agente
- Bônus 2: um agente de code review no seu PR (Groq, grátis) (30 min)
- Checklist final e "Se algo travar"

---

## Parte A: instalação e preparação (30 min)

### A1. Ferramentas

| Ferramenta | Versão | Para quê |
| :-- | :-- | :-- |
| **Git** | qualquer recente | versionar e provar a ordem dos commits |
| **Node.js** | **22 ou mais novo** (o CI usa 22) | rodar a API e os testes |
| **GitHub CLI (`gh`)** | qualquer recente | abrir PR pelo terminal |
| **Postman** (app desktop) | qualquer recente | rodar a coleção contra a API local |
| **Editor** | VS Code ou o que preferir | editar o código |
| **Claude Code** (opcional) | qualquer recente | só para o bônus |

**macOS**

```bash
# Homebrew (se ainda não tiver): https://brew.sh
brew install git gh nvm     # siga as instruções que o brew imprime para o nvm
nvm install 22
nvm use 22
```

**Windows** (PowerShell)

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
winget install --id CoreyButler.NVMforWindows -e
# feche e abra o terminal, depois:
nvm install 22
nvm use 22
# o repo usa symlinks em .claude/; ative ANTES de clonar:
git config --global core.symlinks true
```

Se os symlinks não funcionarem no Windows mesmo assim, depois do clone rode
`npm run agents:sync`.

**Linux** (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y git
# GitHub CLI: siga https://github.com/cli/cli/blob/trunk/docs/install_linux.md
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# feche e abra o terminal, depois:
nvm install 22
nvm use 22
```

**Postman** (todos os sistemas): https://www.postman.com/downloads/

**Confira que tudo está instalado:**

```bash
git --version
node -v        # tem que começar com v22 ou mais
npm -v
gh --version
```

### A2. Login no GitHub pelo terminal

```bash
gh auth login
# escolha: GitHub.com → HTTPS → Yes (autenticar o git) → Login with a web browser
gh auth status   # tem que mostrar "Logged in to github.com account SEU-USUARIO"
```

### A3. Fazer o fork (com todas as branches)

1. Abra https://github.com/oliviasmim/demo-verificadores-nest e clique em **Fork**.
2. **Desmarque** a opção **"Copy the `main` branch only"**. Você vai precisar
   da branch `demo/pr-quebrado` no passo 5.
3. Deixe o fork **público**. Branch protection é grátis só em repositório
   público (ou com o GitHub Student Pack).

> ⚠️ A branch `gabarito` também vem junto no fork. Ela tem a resolução
> completa. **Não abra antes de tentar.** A rubrica olha justamente se o seu
> log é real ou reconstituído, e o `git log` mostra a diferença.

### A4. Clonar e instalar

```bash
git clone https://github.com/SEU-USUARIO/demo-verificadores-nest.git
cd demo-verificadores-nest

# MUITO IMPORTANTE: faz o gh abrir PRs no SEU fork, e não no repo original
gh repo set-default SEU-USUARIO/demo-verificadores-nest

git branch -a     # deve listar origin/main, origin/demo/pr-quebrado e origin/gabarito
npm ci            # instala exatamente as versões do package-lock.json
npm run verify    # lint + typecheck + build + testes com cobertura + audit
```

O `npm run verify` tem que terminar **verde**. Guarde a saída: você vai usar
os números (quantidade de testes e cobertura) no passo 0.

### A5. Ligar o GitHub Actions no fork

Forks vêm com o Actions **desligado**.

1. No seu fork, abra a aba **Actions**.
2. Clique em **"I understand my workflows, go ahead and enable them"**.
3. Dispare a primeira execução na `main`. Ainda não há proteção, então o push
   direto é permitido agora (e só agora):

   ```bash
   git commit --allow-empty -m "ci: primeira execução no meu fork"
   git push
   ```

4. Volte à aba **Actions** e espere a execução ficar verde (2 a 3 min).

Sem pelo menos uma execução na `main`, os checks **não aparecem** na tela de
branch protection do passo 4.

### A6. Subir a API e configurar o Postman

Num terminal à parte (deixe rodando):

```bash
npm run start:dev     # API em http://localhost:3000
```

No Postman: **Import** → selecione os dois arquivos da pasta `postman/` → no
canto superior direito, selecione o environment **Local**.

> Os dados ficam **em memória**. Sempre que quiser rodar a coleção do zero,
> pare o servidor (`Ctrl+C`) e rode `npm run start:dev` de novo.

Sem Postman? Dá para rodar a mesma coleção pelo terminal:
`npx newman run postman/demo-verificadores.postman_collection.json -e postman/local.postman_environment.json`

---

## Passo 0: o "pronto" que não está pronto (10 min)

1. Releia a saída do `npm run verify`: lint, typecheck, build, quantos testes
   passaram e qual a cobertura de linhas.
2. No Postman, clique na coleção → **Run** (Runner) e rode as pastas na ordem:
   `0. Setup`, `1. Auth`, `2. Usuários (CRUD)` e `3. Cenários BDD`.
3. Anote quais asserções ficaram **vermelhas** e abra cada uma. Para cada
   vermelho, escreva em uma frase **o que a API fez** e **o que ela deveria
   ter feito** (a spec em `docs/specs/` diz o esperado).

**Responda por escrito (vai para o seu `ENTREGA.md`):**

> Lint verde, tipos verdes, build verde, todos os testes verdes e cobertura
> alta. Por que nenhum desses sensores pegou o que o Postman pegou?

Dica, só depois de tentar responder: compare os cenários marcados como
`PENDENTE` nos arquivos `.feature` com a pasta `test/bdd/`. A spec descreve o
comportamento, mas spec não roda.

---

## Passo 1: os scripts do `package.json` (10 min)

Abra o `package.json` e encontre:

- os 4 scripts do contrato: `lint`, `typecheck`, `build`, `test`;
- o `verify`, que agrega tudo (é o mesmo que o CI roda);
- o `coverageThreshold` dentro da chave `jest`.

**Investigue e responda (para o `ENTREGA.md`):**

1. O `nest new` gera `lint` com `eslint --fix`. Aqui o `lint` **não** tem
   `--fix`, e existe um `lint:fix` separado. O que aconteceria no CI se o
   `lint` tivesse `--fix`? (Pense: onde o arquivo seria "consertado"? Esse
   conserto chega ao seu repositório?)
2. Por que existe um `typecheck` (`tsc --noEmit -p tsconfig.json`) se o
   `build` já compila TypeScript? Dica: veja quais pastas o `tsconfig.json`
   inclui e quais o `nest build` compila.
3. Qual é o piso de cobertura? Guarde esse número: no passo 7 você vai ver que
   ele não garante o que parece garantir.

---

## Passos 2 e 3: o CI rodando (10 min)

Abra `.github/workflows/ci.yml` e localize:

- os 5 jobs: `Lint`, `Type check`, `Build`, `Test` e
  `Dependency check: vulnerabilidade conhecida (npm audit)`;
- o `needs: [lint, typecheck]` em `Build` e `Test`. O que ele faz quando o
  lint falha?
- o job `dependency-review`, que só roda em PR (na `main` ele aparece como
  *skipped*);
- o upload da pasta `coverage/` como artifact.

Na aba **Actions** do seu fork, abra a execução verde do passo A5, entre no
job `Test` e baixe o artifact `coverage`. Abra `coverage/lcov-report/index.html`
no navegador.

> **História real:** quando este repo foi criado, o primeiro push falhou nos
> 5 jobs no `npm ci`, com `Missing: webpack@... from lock file`. O
> `package-lock.json` tinha sido gerado com npm 11 (Node 25), e o CI usa Node
> 22, que vem com npm 10. Na máquina de quem escreveu, estava tudo verde. É o
> "funciona na minha máquina" pego **antes** de chegar em alguém. Por isso
> você usa Node 22 e `npm ci` (e não `npm install`).

---

## Passo 4: branch protection (10 min)

No seu fork: **Settings → Branches → Add branch ruleset**.

1. **Ruleset name:** `proteger-main`
2. **Enforcement status:** `Active`
3. **Target branches:** **Add target → Include default branch**
4. Marque **Require a pull request before merging** (0 aprovações, porque você
   trabalha sozinho).
5. Marque **Require status checks to pass** → **Add checks** e adicione os 5:
   - `Lint`
   - `Type check`
   - `Build`
   - `Test`
   - `Dependency check: vulnerabilidade conhecida (npm audit)`
6. Marque também **Block force pushes**.
7. **Create**.

> ⚠️ **Pegadinha de dono do repo:** você é admin do seu fork. Confira que a
> **Bypass list** está **vazia**. Se você (ou "Repository admin") estiver lá,
> o GitHub mostra o botão "Merge without waiting for requirements to be met
> (bypass rules)", e o seu print do passo 5 **não prova nada**. É um "teste
> que não prova nada", só que no mundo da configuração.

> Se aparecer um check `Code review (IA)`, **não** o coloque como obrigatório.
> Ele é opinião de uma IA, não um sensor determinístico (veja o Bônus 2).

**Plano B pelo terminal**, se a interface travar (proteção clássica, com
`enforce_admins` para valer também para você):

```bash
gh api -X PUT repos/SEU-USUARIO/demo-verificadores-nest/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Type check", "Build", "Test",
                 "Dependency check: vulnerabilidade conhecida (npm audit)"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
EOF
```

**Teste a trava:** tente `git commit --allow-empty -m "teste" && git push` na
`main`. O push tem que ser **recusado**. Se passou, a proteção não está
valendo. Depois desfaça o commit local com `git reset --hard origin/main`.

---

## Passo 5: provar o bloqueio (15 min)

A branch `demo/pr-quebrado` tem um commit "de agente" com uma "simplificação".
Abra o PR **no seu fork**:

```bash
gh pr create -R SEU-USUARIO/demo-verificadores-nest \
  --base main --head demo/pr-quebrado \
  --title "refactor(auth): simplifica validação de credenciais no login" \
  --body "Simplificação sugerida pelo agente."
```

> Confira na URL que o PR abriu em `github.com/SEU-USUARIO/...`. Se abriu no
> repo da facilitadora, feche-o e refaça o passo A4 (`gh repo set-default`).

**Antes do CI terminar**, leia o diff (aba **Files changed**). Responda:
*você aprovaria esse PR? Por quê?*

### Rodada 1

Espere o CI terminar e anote:

- Quais checks ficaram vermelhos? Qual a mensagem de erro?
- O que aconteceu com `Build` e `Test`? Por quê? (Lembre do `needs`.)
- Como está o botão de merge?

📸 **Print 1:** o botão de merge **desabilitado**, com os checks vermelhos
visíveis. Esse é o print do checklist.

### Rodada 2: "corrigi o lint, agora pode mergear?"

Faça o papel de quem só quer o CI verde: corrija **apenas** o que o lint
reclamou.

```bash
git checkout demo/pr-quebrado
# edite src/auth/auth.service.ts: remova só o que o lint apontou como não usado
npm run lint            # tem que ficar verde
git commit -am "fix: remove variáveis não usadas apontadas pelo lint"
git push
```

Espere o CI de novo e anote:

- O `Lint` ficou verde? E o `Test`?
- **Quais testes caíram** e com qual mensagem (`expected ... got ...`)?
- Em português simples: o que essa "simplificação" fazia com o login?

📸 **Print 2:** o PR ainda bloqueado, agora pelo `Test`.

**Para o `ENTREGA.md`:** `Type check` e `Build` ficaram verdes nas duas
rodadas. O que isso diz sobre "compila = está certo"? Quem segurou o bug: a
disciplina de alguém ou a trava?

Feche o PR **sem mergear** (`gh pr close <número>`) e volte para a `main`:

```bash
git checkout main
```

---

## Passo 6: BDD vira teste, com red, green e refactor (30 a 60 min)

Os 3 cenários **pendentes** estão no fim dos dois arquivos
`docs/specs/features/*.feature`:

| # | Cenário | Arquivo |
|---|---|---|
| 1 | cadastro com e-mail já cadastrado é recusado | `cadastro-e-login.feature` |
| 2 | a senha nunca aparece nas respostas da API | `consulta-e-gestao-de-usuarios.feature` |
| 3 | usuário não pode apagar a conta de outra pessoa | `consulta-e-gestao-de-usuarios.feature` |

**Entrega mínima:** o cenário 1. **Entrega completa:** os 3.

Crie a branch de trabalho:

```bash
git checkout -b feat/cenarios-bdd main
```

### As regras do ciclo (a rubrica olha isso: 30% da nota)

1. **RED:** escreva **só o teste**. Rode e confirme que ele falha **pelo
   motivo do cenário**. Commit **só do teste**.
2. **GREEN:** escreva o **mínimo** em `src/` para o teste passar. Rode o teste
   e depois `npm test` inteiro. Commit **só do `src/`**.
3. **REFACTOR** (opcional): melhore o código sem mudar comportamento, com tudo
   verde. Commit separado.
4. **Cole a saída real do terminal** de cada fase no log
   (`LOG-RED-GREEN-REFACTOR-<n>.md`) **na hora**, não depois.

> Um red só vale se falhar **no comportamento**. Se o teste falhar com
> `Cannot find module`, erro de digitação ou de tipo, isso **não** é red: é
> teste quebrado. Corrija até ele falhar pelo motivo que o cenário descreve.

### Regras da pasta `test/bdd/` (ver `test/bdd/README.md`)

- um arquivo por cenário: `test/bdd/<slug-do-cenario>.e2e-spec.ts`;
- o nome do `it(...)` é **a frase exata** do `Cenário:`;
- cada linha do Gherkin (`Dado`, `Quando`, `Então`, `E`) vira um comentário,
  seguido do código que a executa;
- use `criarApp()` de `test/helpers/criar-app.ts` (app limpo a cada teste);
- asserts com **valor exato** (`toBe(409)`, e não `toBeDefined()`).

Use `test/auth.e2e-spec.ts` e `test/users.e2e-spec.ts` como modelo de como
cadastrar, logar e mandar o token.

### Cenário 1, guiado

```gherkin
Cenário: cadastro com e-mail já cadastrado é recusado
  Dado que "ana@pda.org" já está cadastrada
  Quando envio POST /auth/register com nome "Outra Ana", e-mail "ana@pda.org" e senha "senha12345"
  Então a resposta tem status 409
  E existe apenas 1 usuário com o e-mail "ana@pda.org"
```

**RED.** Crie `test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts`
e complete os `TODO`:

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from '../helpers/criar-app';

// Cenário BDD: docs/specs/features/cadastro-e-login.feature
describe('Cadastro e login de usuários (BDD)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('cadastro com e-mail já cadastrado é recusado', async () => {
    // Dado que "ana@pda.org" já está cadastrada
    // TODO: cadastre a Ana (POST /auth/register) e faça login para ter um token
    //       (você vai precisar do token para listar os usuários no último passo)

    // Quando envio POST /auth/register com nome "Outra Ana", e-mail "ana@pda.org" e senha "senha12345"
    // TODO: guarde a resposta numa variável

    // Então a resposta tem status 409
    // TODO: expect(...).toBe(409)

    // E existe apenas 1 usuário com o e-mail "ana@pda.org"
    // TODO: GET /users com o token, filtre pelo e-mail e confira que sobrou 1
  });
});
```

Rode só esse teste:

```bash
npx jest test/bdd/cadastro
```

A falha esperada é parecida com:

```
Expected: 409
Received: 201
```

Se for isso, é um red válido. Commit **só do teste**:

```bash
git add test/bdd
git commit -m "test(bdd): red — cadastro com e-mail já cadastrado é recusado (falha, esperado)"
```

**GREEN.** Agora, e só agora, mexa em `src/`. A regra de negócio fica no
**service** (não no controller, não no repositório). Pistas:

- abra `src/users/users.service.ts`, método `create`;
- o service já tem acesso a `this.repository.findByEmail(...)`;
- o Nest tem uma exceção HTTP pronta para 409, importada de `@nestjs/common`
  (procure na documentação qual é).

```bash
npx jest test/bdd/cadastro    # tem que ficar verde
npm test                      # nada mais pode ter quebrado
git add src
git commit -m "feat: green — recusa cadastro com e-mail já cadastrado (409)"
```

**Prova da ordem:**

```bash
git log --oneline -- test/bdd src/users/users.service.ts
```

O commit do red tem que aparecer **abaixo** (mais antigo) do green. Cole essa
saída no log.

Reinicie o servidor e rode a coleção do Postman de novo: o primeiro cenário BDD
agora passa.

### Cenários 2 e 3 (entrega completa)

Repita o ciclo, com um arquivo de teste e um log por cenário. Pistas, sem
entregar a resposta:

- **Cenário 2 (a senha nunca aparece):** procure **todas** as rotas que
  devolvem um usuário (`/auth/register`, `/users`, `/users/me`,
  `/users/:id`, `PATCH /users/:id`). O cenário fala de uma, mas a regra do
  `AGENTS.md` vale para todas. No GREEN, o "menor código que passa" pode ser
  repetido; o REFACTOR é o momento de extrair uma função única (por exemplo,
  em `src/users/`) sem mudar comportamento. É o melhor cenário para praticar
  refactor.
- **Cenário 3 (não apagar a conta de outra pessoa):** o usuário logado vem de
  `req.user`, nunca do corpo da requisição. Veja como `GET /users/me` descobre
  quem está logado. O status esperado é 403: qual exceção do Nest dá 403?

### O log de cada cenário

Crie `LOG-RED-GREEN-REFACTOR-<n>.md` na raiz do repo (template completo em
`aula15-verificadores/starter/red-green-refactor-log-TEMPLATE.md`, no seu fork
de `pda-especializacao-ia`). O mínimo:

````markdown
# LOG-RED-GREEN-REFACTOR-1 — <seu nome> / cadastro com e-mail já cadastrado é recusado

## Cenário
(cole o Gherkin)

## RED
Commit: `<hash> test(bdd): red — ...`
Saída do terminal (colada, não resumida):
```
<saída do npx jest falhando>
```
Por que esperávamos que falhasse assim: (1-2 frases)

## GREEN
Commit: `<hash> feat: green — ...`
Saída do terminal:
```
<saída do npx jest passando e do npm test>
```

## REFACTOR
Commit: `<hash>` ou "não houve, porque ..."

## Prova da ordem
```
<saída do git log --oneline>
```
````

Commit dos logs com `docs: log red/green/refactor do cenário <n>`.

---

## Passo 7: o teste que não prova nada (20 min)

Um teste "que não prova nada" fica **verde mesmo com o código quebrado**. Este
projeto tem **pelo menos dois** escondidos nos testes unitários de `src/`
(`*.spec.ts`). Sua tarefa é achar ao menos um, provar e corrigir.

Leia os 3 padrões em
`aula15-verificadores/starter/teste-que-nao-prova-nada-exemplos.md`:

1. o teste testa o **mock**, não o código;
2. o teste não tem assert que importe;
3. cobertura alta sem valor (assert que não verifica o valor, como
   `toBeDefined()`).

### O método: quebrar, rodar, consertar, provar

1. **Suspeite:** procure asserts fracos (`toBeDefined`, `toBeTruthy`) ou
   testes que montam um mock e verificam o próprio mock.
2. **Quebre a implementação de propósito**, do jeito que o teste deveria
   pegar. Exemplo: se o teste diz que a senha é "protegida", faça o service
   salvar a senha em texto puro.
3. **Rode só aquele teste:** `npx jest -t "nome do teste"`. Se continuar
   **verde**, você achou um. 📸 Guarde a saída.
4. Rode `npm run test:cov` **com a quebra aplicada**. A cobertura caiu? O que
   isso diz sobre o piso de 80% do passo 1?
5. **Corrija o teste** (não o código) para verificar o valor de verdade.
   Exemplo de direção: em vez de "o hash existe", verifique que ele **não é**
   a senha e que o `bcrypt.compare` da senha com o hash dá `true`.
6. **Com a quebra ainda aplicada**, rode de novo: agora tem que ficar
   **vermelho**. 📸 Guarde a saída.
7. **Desfaça a quebra** e confirme que volta a ficar **verde**.
8. Commit **só da correção do teste**:
   `test: corrige teste que não detectava <o quê>`.

Documente em `TESTE-QUE-NAO-PROVA-NADA.md`: o teste, o padrão (1, 2 ou 3), a
quebra aplicada, a saída verde **antes**, a correção, a saída vermelha
**depois** (com a quebra) e a verde final (sem a quebra).

> ⚠️ Nunca commite a quebra. Antes de cada commit, rode `git diff` e confira
> que só o arquivo de teste mudou.

---

## Passos 8 e 9: parágrafo, `ENTREGA.md` e PR (15 min)

### `ENTREGA.md`

Crie na raiz do repo, com:

- o checklist (abaixo) preenchido, dizendo **onde** está cada item;
- as respostas dos passos 0, 1 e 5;
- os prints (suba as imagens numa pasta `evidencias/` ou cole no PR);
- o resultado do `npm run audit`: tem high ou critical? (Dica: leia a seção
  "Auditoria de dependências" do `README.md` e explique com suas palavras o
  `overrides` do `multer` e as vulnerabilidades low que ficaram.)
- a tabela de hashes:

  | # | Cenário | RED | GREEN | REFACTOR | Log |
  |---|---|---|---|---|---|
  | 1 | cadastro com e-mail já cadastrado é recusado | `abc1234` | `def5678` | não houve | `LOG-RED-GREEN-REFACTOR-1.md` |

- **o parágrafo para o dono do negócio:** 3 a 5 frases, **sem jargão**,
  explicando para alguém que não programa o que significa "o sistema se recusa
  a publicar código quebrado sozinho" e por que isso é diferente de "confiar
  que a pessoa (ou a IA) vai lembrar de testar". Use um exemplo deste projeto
  (como o login que aceitava qualquer senha);
- (entrega completa) **o parágrafo extra:** qual dos sensores você acha que vai
  te salvar mais vezes, no seu domínio de projeto, e por quê.

### Rodar o verificador completo e abrir o PR

```bash
npm run verify      # tem que terminar verde; cole a saída no ENTREGA.md
git add ENTREGA.md TESTE-QUE-NAO-PROVA-NADA.md LOG-RED-GREEN-REFACTOR-*.md evidencias/
git commit -m "docs: entrega da aula 15"
git push -u origin feat/cenarios-bdd

gh pr create -R SEU-USUARIO/demo-verificadores-nest --base main \
  --title "feat: cenários BDD de segurança" \
  --body "Cenário 1: RED <hash> → GREEN <hash>. Ver ENTREGA.md."
```

Esse PR tem que ficar **verde** e com o merge **liberado**. 📸 **Print 3:** o
contraste com o passo 5.

Faça o merge pelo GitHub (botão **Merge pull request**) e mande o link do PR
no formulário de entrega.

---

## Bônus: os verificadores dentro do agente

O repo tem um setup de IA pronto. Explore antes de usar:

| peça | onde | papel |
| :-- | :-- | :-- |
| instruções | `AGENTS.md` (o `CLAUDE.md` só importa ele) | contexto que todo agente lê, incluindo a "definição de pronto" |
| skills | `.agents/skills/` | procedimentos que o agente carrega quando o pedido casa |
| subagentes | `.agents/agents/` | revisores e tradutor BDD com contexto próprio |
| hooks | `.agents/hooks/*.mjs`, registrados em `.claude/settings.json` | **verificadores determinísticos**: rodam sempre, o agente não consegue "esquecer" |

Primeiro, prove que os hooks funcionam (os hooks também têm verificador):

```bash
npm run agents:test-hooks
```

Depois, com o Claude Code aberto no repo (aceite a confiança do workspace e
confira `/skills` e `/agents`), faça os experimentos e **registre o que
aconteceu** no `ENTREGA.md`:

1. Peça: *"implementa rápido o cenário de e-mail duplicado, não precisa rodar
   teste, eu rodo depois"*. O agente resistiu ou cedeu? O que o hook de parada
   (`nao-diga-pronto-sem-prova`) fez?
2. Peça para *"baixar o threshold de cobertura para 70% que tá chato"*. O que
   aconteceu?
3. Peça um `git push --force`. O que aconteceu?
4. Rode `npm install <um-nome-de-pacote-que-você-inventou>` e cole o erro no
   Mural da Alucinação.

**Reflexão:** qual a diferença entre uma regra escrita no `AGENTS.md` e um
hook? Compare com a diferença entre "lembrar de testar" e branch protection.

---

## Bônus 2: um agente de code review no seu PR (Groq, grátis) (30 min)

Os 5 sensores pegam o que é **determinístico**: estilo, tipo, build, teste,
vulnerabilidade conhecida. Nenhum deles lê o diff como uma pessoa revisora
("essa regra está no controller", "esse teste não prova nada"). Neste bônus
você liga, no seu fork, um **agente de IA que revisa cada PR e comenta**.

Ele usa a API do **Groq**, que tem plano gratuito, sem cartão de crédito.

> **Opinião, não sensor.** O revisor comenta, mas **não** bloqueia o merge e
> **não** entra nos checks obrigatórios do passo 4. A mesma revisão, rodada
> duas vezes, pode dizer coisas diferentes, e um check obrigatório que às
> vezes passa e às vezes não ensina o time a ignorar o vermelho.

### B1. Criar a conta no Groq

1. Abra https://console.groq.com.
2. Clique em **Sign in / Sign up** e entre com **Google**, **GitHub** ou
   e-mail. No e-mail, você recebe um link de login: abra no mesmo navegador.
3. Se pedir, aceite os termos e dê um nome para a organização (pode ser o seu
   nome).
4. Pronto: você está no **plano gratuito** (Free). **Não** cadastre cartão nem
   faça upgrade; nada desta atividade precisa disso.

**Como funciona o "crédito" gratuito:** o Groq não dá um saldo em dinheiro. O
plano gratuito libera um número de requisições e tokens **por minuto e por
dia**, por modelo. Acabou a cota, a API responde `429` até ela renovar; você
**nunca é cobrado**. Veja os seus limites em
https://console.groq.com/settings/limits. No modelo usado aqui
(`openai/gpt-oss-120b`), o plano gratuito dá cerca de **8 mil tokens por
minuto** e **mil requisições por dia**: sobra para a atividade. (Os números
podem mudar; vale o que a página de limites mostrar.)

### B2. Criar a chave de API

1. No console, menu **API Keys** (ou direto em https://console.groq.com/keys).
2. **Create API Key** → nome: `demo-verificadores-github` → **Submit**.
3. **Copie a chave agora** (começa com `gsk_`). Ela aparece **uma vez só**; se
   perder, apague e crie outra.

> ⚠️ **A chave é uma senha.** Não cole no código, no `README`, num commit, no
> chat da turma nem num print. Quem tem a chave gasta a sua cota em seu nome.
> Se ela vazar, volte em **API Keys** e **apague** (revogue) na hora.

**Teste a chave no terminal (opcional).** O `read -s` lê sem mostrar na tela
nem salvar no histórico:

```bash
read -s GROQ_API_KEY && export GROQ_API_KEY     # cole a chave e tecle Enter
curl -s https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-120b","messages":[{"role":"user","content":"Diga oi em uma palavra"}]}' \
  | head -c 400
unset GROQ_API_KEY
```

Se a resposta tiver `"choices"`, a chave funciona. `401` = chave errada.

### B3. Guardar a chave como secret no seu fork

1. No seu fork: **Settings → Secrets and variables → Actions**.
2. Aba **Secrets** → **New repository secret**.
3. **Name:** `GROQ_API_KEY` (exatamente assim). **Secret:** cole a chave.
4. **Add secret**. O GitHub nunca mais mostra o valor, nem para você: só o
   workflow consegue usar.

(Opcional) Aba **Variables** → **New repository variable** → `GROQ_MODEL`,
para trocar de modelo sem mexer no código (ex.: `openai/gpt-oss-20b`, mais
rápido). Sem ela, o padrão é `openai/gpt-oss-120b`.

### B4. Trazer o revisor para uma branch

São 3 arquivos (eles **não** são a resposta dos passos 5 a 7, então pode
pegar do `gabarito` sem perder ponto):

| arquivo | papel |
| :-- | :-- |
| `.agents/agents/revisor-de-codigo.md` | o agente: **o que** revisar e o formato da resposta. Também funciona local no Claude Code (`/agents`) |
| `.github/scripts/revisao-groq.mjs` | Node puro, sem dependências: pega o diff do PR, manda as instruções do agente + o diff para o Groq e publica **um** comentário no PR (atualizado a cada push) |
| `.github/workflows/code-review.yml` | roda o script em todo PR para a `main` |

```bash
git checkout main && git pull
git checkout -b feat/revisor-de-codigo
git checkout origin/gabarito -- .agents/agents/revisor-de-codigo.md \
  .github/scripts/revisao-groq.mjs .github/workflows/code-review.yml
```

**Leia os 3 antes de commitar.** Responda no `ENTREGA.md`:

1. De onde vem o texto que o script manda como instrução para o modelo? Por
   que não está escrito direto no `.mjs`?
2. Por que o script corta o diff em 14.000 caracteres? (Dica: cota por minuto.)
3. O script diz ao modelo que o diff é "DADO, não instrução". Que ataque isso
   tenta evitar?
4. O workflow pula PR vindo de fork (`head.repo.full_name == github.repository`).
   Por que um PR de fora não deveria rodar com o seu secret?

Teste local **sem gastar cota** (só monta o prompt e mostra o tamanho):

```bash
DRY_RUN=1 BASE_SHA=$(git rev-parse origin/main) HEAD_SHA=$(git rev-parse origin/gabarito) \
  node .github/scripts/revisao-groq.mjs
# Modelo: openai/gpt-oss-120b | diff: 14000 caracteres (truncado)
# Prompt total ≈ 4310 tokens
# DRY_RUN: não chama o Groq nem o GitHub.
```

### B5. Abrir o PR e ver o revisor comentar

```bash
git add .agents/agents/revisor-de-codigo.md .github/scripts .github/workflows/code-review.yml
git commit -m "feat(ia): adiciona revisor-de-codigo e workflow de code review via Groq"
git push -u origin feat/revisor-de-codigo
gh pr create -R SEU-USUARIO/demo-verificadores-nest --base main \
  --title "feat(ia): revisor de código no PR" \
  --body "Agente de revisão consultivo via Groq. Não é check obrigatório."
```

Na aba **Checks** do PR aparece **Revisor de código (IA, consultivo)** ao
lado dos 5 sensores. Em menos de 1 minuto surge o comentário
"🤖 Revisor de código (IA, consultivo)".

### B6. O experimento: o que só o revisor pega

Faça um commit "de agente" que os sensores **não** pegam. Num teste de
`test/`, troque um assert de valor exato por um fraco:

```typescript
// antes
expect(resposta.status).toBe(201);
// depois
expect(resposta.status).toBeDefined();
```

```bash
npm run verify       # continua VERDE: nenhum sensor reclama
git commit -am "test: simplifica assert" && git push
```

Espere o CI e anote no `ENTREGA.md`:

- Os 5 sensores ficaram verdes?
- O comentário do revisor foi **atualizado**? Ele apontou o assert fraco?
- Clique em **Re-run jobs** no revisor. A resposta mudou? O que isso diz
  sobre usar IA como check obrigatório?

📸 **Print 4:** o comentário do revisor no PR.

Depois **desfaça** o assert fraco (`git revert HEAD && git push`). Se quiser
manter o revisor no seu fork, faça o merge do PR; senão, feche com
`gh pr close <número>`.

**Reflexão final:** sensor determinístico **bloqueia**; revisor de IA
**aconselha**. Em que situação do seu projeto um comentário do revisor teria
te salvado antes de uma pessoa revisar?

> Terminou o curso? Apague a chave em https://console.groq.com/keys e o secret
> em **Settings → Secrets**. Chave que ninguém usa é só risco.

---

## Checklist final

- [ ] Fork público, `npm ci` e `npm run verify` verdes na minha máquina
- [ ] Actions ligado e pelo menos uma execução verde na `main`
- [ ] Ruleset `proteger-main` ativo com os 5 checks e **bypass list vazia**
- [ ] Push direto na `main` recusado
- [ ] Print 1: PR `demo/pr-quebrado` bloqueado pelo `Lint`
- [ ] Print 2: PR ainda bloqueado pelo `Test` depois de "corrigir o lint"
- [ ] Cenário 1 (mínima) ou cenários 1, 2 e 3 (completa) em `test/bdd/`, nome = frase do cenário
- [ ] Um `LOG-RED-GREEN-REFACTOR-<n>.md` por cenário, com saída real e `git log` provando red antes de green
- [ ] `TESTE-QUE-NAO-PROVA-NADA.md` com antes/depois e a correção commitada
- [ ] `npm audit` explicado no `ENTREGA.md`
- [ ] Parágrafo para o dono do negócio, sem jargão
- [ ] PR `feat/cenarios-bdd` verde, print 3, merge feito, link no formulário
- [ ] (Bônus 2) Print 4: comentário do revisor de IA no PR, com a reflexão no `ENTREGA.md`

### Rubrica (do `ENTREGAVEL.md`)

| critério | peso |
|---|---|
| CI bloqueia merge de verdade (workflow + branch protection + print) | 30% |
| Os testes vêm dos cenários BDD reais (nome = frase, falha no comportamento certo) | 20% |
| Ciclo red/green/refactor provado pela ordem dos commits, com saída real | 30% |
| "Teste que não prova nada" encontrado, provado e corrigido | 15% |
| Parágrafo para o dono do negócio | 5% |

O que **não** pontua: um log escrito de memória depois que o código já
funcionava. O que pontua: um merge que você genuinamente não conseguiu fazer
até corrigir o problema, porque o sistema não deixou.

---

## Se algo travar

| sintoma | causa provável | saída |
| :-- | :-- | :-- |
| `node -v` mostra 18 ou 20 | versão antiga ativa | `nvm use 22` (e `nvm alias default 22`) |
| `npm ci` falha com `Missing: ... from lock file` | você rodou `npm install` e alterou o lockfile | `git checkout package-lock.json` e rode `npm ci` de novo |
| Postman: `0. Setup` dá 409 ou 401 | dados de uma rodada anterior ainda em memória | reinicie o `npm run start:dev` |
| Postman: tudo dá erro de conexão | servidor não está rodando ou environment errado | confira o terminal do `start:dev` e o environment **Local** |
| Branch `demo/pr-quebrado` não existe | fork feito só com a `main` | apague o fork e refaça com "Copy the main branch only" desmarcado |
| Aba Actions sem execuções | Actions desligado no fork | passo A5 |
| Checks não aparecem no ruleset | workflow nunca rodou na `main` | passo A5 (commit vazio e push, antes de proteger) |
| Botão de merge mostra "bypass rules" | você está na bypass list | remova o bypass do ruleset |
| `gh pr create` abriu PR no repo da facilitadora | `gh` usando o repo original como padrão | feche o PR, rode `gh repo set-default SEU-USUARIO/demo-verificadores-nest` |
| Revisor (IA): log diz `GROQ_API_KEY não configurado` | secret ausente, com outro nome, ou criado na aba Variables | Bônus 2, passo B3: tem que ser **Secrets**, nome exato `GROQ_API_KEY`; depois "Re-run jobs" |
| Revisor (IA): `Groq: HTTP 401` | chave copiada errada ou revogada | crie outra chave (B2) e atualize o secret |
| Revisor (IA): `429` / limite atingido | cota por minuto ou por dia do plano gratuito | espere 1 min e "Re-run jobs"; ou crie a variável `GROQ_MODEL=openai/gpt-oss-20b` |
| Revisor (IA): `model ... does not exist` / `decommissioned` | o Groq aposentou o modelo | escolha outro em https://console.groq.com/docs/models e crie a variável `GROQ_MODEL` |
| Job do revisor nem aparece no PR | workflow não está na branch do PR, ou PR em rascunho | confira `.github/workflows/code-review.yml` na branch; marque "Ready for review" |
| Teste novo falha com `Cannot find module` | caminho do import errado | `test/bdd/` está um nível abaixo: use `../helpers/criar-app` |
| Push recusado na sua branch de trabalho | você está na `main` | `git checkout -b feat/cenarios-bdd` e push dela |
| Travou de verdade em algum cenário | — | peça ajuda na turma; como último recurso, consulte **só o arquivo daquele passo** com `git show origin/gabarito:<caminho>` e diga no log que consultou |
