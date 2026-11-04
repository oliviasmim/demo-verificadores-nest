# Demo ao vivo — o ENTREGAVEL feito de ponta a ponta num projeto NestJS

Roteiro da facilitadora para fazer, na frente da turma, **cada passo do
`ENTREGAVEL.md`** num projeto de verdade: API NestJS de usuários com cadastro,
login, senha com hash e JWT.

| | |
| :-- | :-- |
| **Repositório** | https://github.com/oliviasmim/demo-verificadores-nest (público, porque branch protection é grátis só em repo público) |
| **Clone local** | `/Users/iasmim/ai-repos/demo-verificadores-nest` |
| **Specs BDD** | `docs/specs/SPEC-usuarios-autenticacao.md` + `docs/specs/features/*.feature` |
| **Postman** | `postman/demo-verificadores.postman_collection.json` + `postman/local.postman_environment.json` |

## As 3 branches

| branch | o que tem | pra que serve na aula |
| :-- | :-- | :-- |
| `main` | API funcionando, CI verde, specs com **3 cenários pendentes**, 2 "testes que não provam nada" plantados | ponto de partida da demo ao vivo |
| `demo/pr-quebrado` | 1 commit "de agente" que remove o `bcrypt.compare` do login (aceita qualquer senha) + 1 variável sem uso | PR que o CI **tem** que bloquear (passo 5) |
| `gabarito` | os 3 ciclos red/green/refactor com commits na ordem certa, os 3 logs, o teste que não prova nada corrigido, `ENTREGA.md` com o parágrafo pro dono do negócio, o agente `revisor-de-codigo` + workflow de code review via Groq | plano B se a demo travar, e exemplo de "entrega completa" pra mostrar no fim |

> **Surpresa da aula:** o README do projeto **não** diz que existem bugs nem
> testes ruins. A turma vê um projeto "pronto, com CI verde e 80%+ de
> cobertura" e descobre os furos junto com você. É o ponto da semana: verde
> não é a mesma coisa que verificado.

---

## Antes da aula (10 min, uma vez)

```bash
cd /Users/iasmim/ai-repos/demo-verificadores-nest
git checkout main && git pull
npm ci
npm run verify          # tem que terminar verde
npm run start:dev       # deixa rodando num terminal à parte
```

No Postman: **Import** → os dois arquivos da pasta `postman/` → selecione o
environment **local**. A coleção depende de um servidor recém-iniciado (o
repositório é em memória). Se precisar zerar no meio da aula, reinicie o
`start:dev`.

Confira na aba **Actions** do repo que existe pelo menos uma execução verde
na `main`. Sem isso, os checks não aparecem na tela de branch protection.

---

## Passo 0 — "O agente disse que está pronto" (5 min)

1. Mostre o README e rode `npm run verify` ao vivo: lint, typecheck, build,
   **40 testes** e cobertura de 100% em linhas. Tudo verde.
2. Postman → **Run collection** (Runner) com as pastas na ordem.
   - `0. Setup`, `1. Auth` e `2. Usuários (CRUD)` passam.
   - `3. Cenários BDD`: **6 asserções vermelhas**.
3. Abra cada vermelho:
   - cadastrar `ana@pda.org` de novo devolve **201**, e agora existem duas Anas;
   - `GET /users/{{idAna}}` devolve o campo **`passwordHash`**;
   - Bruno faz `DELETE /users/{{idAna}}` e recebe **204**: apagou a conta da Ana.

**Pergunta pra turma:** "Lint verde, tipos verdes, build verde, 40 testes
verdes e 100% de cobertura de linha. Por que nenhum desses sensores pegou
esses três bugs?" A resposta que você quer ouvir: **ninguém escreveu o
teste do comportamento**. Os cenários estavam na spec, mas a spec não roda.

---

## Passo 1 — Os scripts do `package.json` (ENTREGAVEL, passo 1) (5 min)

Abra o `package.json` e mostre os 4 nomes do contrato (`lint`, `typecheck`,
`build`, `test`) e o `verify`, que agrega tudo. Destaque três decisões:

- **`lint` sem `--fix`.** O `nest new` gera `eslint --fix`. No CI, isso
  "conserta" o problema na máquina descartável do runner e o job passa
  verde. O sensor fica cego. O `--fix` foi para `lint:fix`, que é de uso local.
- **`typecheck` separado do `build`.** `tsc --noEmit -p tsconfig.json` checa
  `src/` **e** `test/`. O `nest build` só compila `src/`, então um erro de
  tipo num teste passaria despercebido.
- **`test:cov` com `coverageThreshold` de 80%** (no `jest` do
  `package.json`). Abaixo disso, o job falha. Guarde esse número: no passo 7
  ele vai virar a pegadinha.

---

## Passo 2 e 3 — O CI rodando (ENTREGAVEL, passos 2–3) (5 min)

Abra `.github/workflows/ci.yml`. É o `starter/ci-workflow/ci.yml` com uma
mudança: o job `Test` roda `npm run test:cov` e publica a pasta `coverage/`
como artifact.

**História real pra contar** (aconteceu montando esta demo):
- O **primeiro push falhou nos 5 jobs**, no `npm ci`, com
  `Missing: webpack@5.112.2 from lock file`
  (https://github.com/oliviasmim/demo-verificadores-nest/actions/runs/40767973202).
- **Causa:** o `package-lock.json` foi gerado com npm 11 (Node 25 local), e
  o CI usa Node 22, que vem com npm 10. Na máquina de quem escreveu, estava
  tudo verde.
- **Correção:** o commit `13d6cf7` regenerou o lockfile com npm 10.
- **Pra turma:** é o "funciona na minha máquina" pego **antes** de chegar
  em alguém. Um sensor que só roda local não teria visto.

Mostre a execução verde seguinte na aba Actions: 5 checks verdes. O
`dependency-review` aparece como *skipped* porque só roda em PR.

---

## Passo 4 — Branch protection (ENTREGAVEL, passo 4) (8 min)

Faça **pela interface**, seguindo `starter/branch-protection-guia.md`, com a
turma vendo:

1. Settings → Branches → **Add branch ruleset**.
2. Nome `proteger-main`, Enforcement **Active**, Target **Include default
   branch**.
3. Marque **Require a pull request before merging** (0 aprovações).
4. Marque **Require status checks to pass** e adicione os 5:
   - `Lint`
   - `Type check`
   - `Build`
   - `Test`
   - `Dependency check: vulnerabilidade conhecida (npm audit)`

> ⚠️ **Pegadinha de dona do repo:** você é admin. Confira que a lista
> **Bypass list** está **vazia**. Se você (ou "Repository admin") estiver
> lá, o GitHub mostra o botão "Merge without waiting for requirements to be
> met (bypass rules)" e o print do passo 5 não prova nada. Vale comentar
> com a turma que essa é uma variação do "teste que não prova nada" no
> mundo da configuração.

**Plano B por linha de comando**, se a interface travar (proteção clássica,
com `enforce_admins` para valer também pra você):

```bash
gh api -X PUT repos/oliviasmim/demo-verificadores-nest/branches/main/protection \
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

---

## Passo 5 — Provar o bloqueio (ENTREGAVEL, passo 5) (10 min)

```bash
gh pr create -R oliviasmim/demo-verificadores-nest \
  --base main --head demo/pr-quebrado \
  --title "refactor(auth): simplifica validação de credenciais no login" \
  --body "Simplificação sugerida pelo agente."
```

Leia o diff com a turma **antes** do CI terminar. Ele parece inocente:
"remove a segunda chamada ao bcrypt". Pergunte: "vocês aprovariam?"

**Rodada 1: o lint pega.**
- **Status:** `Lint` fica vermelho (`'bcrypt' is defined but never used` e
  `'emailNormalizado' is assigned a value but never used`).
- **Efeito:** como `Build` e `Test` têm `needs: [lint, typecheck]`, eles
  nem rodam.
- **Print:** o botão de merge fica **desabilitado** ("Required statuses must
  pass before merging"). Esse é o print do checklist.

**Rodada 2: "corrigi o lint, pode mergear?"** Ao vivo, remova a linha
`const emailNormalizado = ...` e o `import * as bcrypt` de
`src/auth/auth.service.ts` na branch, depois commit e push.
- **Status:** `Lint` fica verde, e agora o `Test` roda e fica **vermelho**.
- **Testes que caem:**
  - `login com senha errada é recusado com mensagem genérica`:
    `expected 401, got 200`. Agora **qualquer senha entra**.
  - `AuthService › recusa senha errada com mensagem genérica`.
  - `atualizar a senha permite login com a nova senha`.
- **Continua bloqueado.**

**Fala-chave:** o `Type check` e o `Build` ficaram verdes nas duas rodadas.
"Compila" não quer dizer "está certo". Quem segurou o bug de segurança foi
o teste de comportamento, e quem impediu o merge foi a trava, não a
disciplina de alguém.

Feche o PR sem mergear (ou deixe aberto como evidência).

---

## Passo 6 — BDD → teste, um ciclo red/green ao vivo (ENTREGAVEL, passo 6) (15 min)

Faça **só o cenário 1** ao vivo. Os cenários 2 e 3 estão prontos no
`gabarito` para mostrar depois.

```bash
git checkout -b feat/cenarios-bdd main
```

Abra `docs/specs/features/cadastro-e-login.feature` e copie o cenário:

```gherkin
Cenário: cadastro com e-mail já cadastrado é recusado
  Dado que "ana@pda.org" já está cadastrada
  Quando envio POST /auth/register com nome "Outra Ana", e-mail "ana@pda.org" e senha "senha12345"
  Então a resposta tem status 409
  E existe apenas 1 usuário com o e-mail "ana@pda.org"
```

### RED

Crie `test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts`. O
nome do teste é a frase do cenário, e cada linha do Gherkin vira um
comentário seguido do código que a executa. O arquivo pronto está em
`git show gabarito:test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts`.

```bash
npx jest test/bdd/cadastro
#   Expected: 409
#   Received: 201          <- falhou PELO MOTIVO DO CENÁRIO, não por import quebrado
git add test/bdd && git commit -m "test(bdd): red — cadastro com e-mail já cadastrado é recusado (falha, esperado)"
```

**Ponto pra turma:** se o teste falhar com `Cannot find module`, ainda não é
um red válido. O red só vale quando falha **no comportamento** que o cenário
descreve.

### GREEN

Em `src/users/users.service.ts`, no começo de `create`:

```typescript
if (this.repository.findByEmail(dto.email)) {
  throw new ConflictException('E-mail já cadastrado');
}
```

Para fechar o green:
1. Importe `ConflictException` de `@nestjs/common`.
2. Rode `npx jest test/bdd/cadastro` e confira que fica verde.
3. Rode `npm test` para confirmar que nada mais quebrou.
4. Commit só do `src/` com a mensagem `feat: green — recusa cadastro com
   e-mail já cadastrado (409 Conflict)`.

### Prova da ordem

```bash
git log --oneline -- test/bdd src/users/users.service.ts
```

O red aparece **abaixo** (mais antigo) do green. É isso que a rubrica
olha (30% da nota). Volte ao Postman: reinicie o servidor e rode a
coleção. O primeiro cenário BDD agora passa.

### Os outros dois

Mostre no `gabarito` com `git log --oneline main..gabarito`:

| # | Cenário | RED | GREEN | REFACTOR |
|---|---|---|---|---|
| 1 | cadastro com e-mail já cadastrado é recusado | `4c62fd8` | `6f9e77d` | não houve |
| 2 | a senha nunca aparece nas respostas da API | `103da73` | `cca076b` | `9e21ea5` |
| 3 | usuário não pode apagar a conta de outra pessoa | `e25e09b` | `b088244` | não houve |

O cenário 2 é o melhor exemplo de **refactor**:
- **Green:** é de propósito o "menor código que passa", uma função `semSenha`
  repetida em cada controller.
- **Refactor:** extrai `toPublicUser` (`src/users/public-user.ts`) sem mudar
  comportamento.
- **Prova:** o `npm test` continua verde depois do refactor.

Os logs completos com a saída real do terminal estão em
`LOG-RED-GREEN-REFACTOR-{1,2,3}.md` na branch `gabarito`.

---

## Passo 7 — O teste que não prova nada (ENTREGAVEL, passo 7) (8 min)

O projeto tem dois plantados:

| arquivo | teste | padrão (de `starter/teste-que-nao-prova-nada-exemplos.md`) |
| :-- | :-- | :-- |
| `src/users/users.service.spec.ts` | `cria usuário com senha protegida` | 3, cobertura alta sem valor (`expect(user.passwordHash).toBeDefined()`) |
| `src/auth/auth.service.spec.ts` | `login retorna token` | 1, testa o mock, não o `AuthService` |

Ao vivo, faça o primeiro (o mais assustador):

1. Em `UsersService.create`, troque `passwordHash` por `dto.password`. Agora
   a senha fica salva **em texto puro**.
2. Rode `npx jest -t "cria usuário com senha protegida"` e mostre que ele
   continua **verde**.
3. Mostre que a cobertura continua 100% de linhas. Esse é o número do passo 1.
4. Corrija o teste (com `import * as bcrypt from 'bcryptjs';` no topo do arquivo):

   ```typescript
   expect(user.passwordHash).not.toBe('senha12345');
   expect(await bcrypt.compare('senha12345', user.passwordHash)).toBe(true);
   ```

5. Com a quebra ainda aplicada, rode de novo e mostre que agora fica
   **vermelho**.
6. Desfaça a quebra e mostre que volta a ficar **verde**.

O antes e depois documentado (com o segundo teste também) está em
`TESTE-QUE-NAO-PROVA-NADA.md` na branch `gabarito`.

---

## Passo 8 e 9 — Parágrafo e PR (ENTREGAVEL, passos 8–9) (5 min)

Mostre o `ENTREGA.md` do `gabarito`. Ele tem:
- o checklist preenchido;
- o resultado do `npm audit`: override do `multer` para tirar 1 vulnerabilidade
  high, e 8 low em devDependencies, justificadas;
- o parágrafo para o dono do negócio, sem jargão;
- o parágrafo extra sobre qual sensor mais salva nesse domínio;
- a tabela de hashes red/green que entra na descrição do PR.

Se der tempo:

```bash
git push -u origin feat/cenarios-bdd
gh pr create --base main --title "feat: cenários BDD de segurança" --body "RED 4c62fd8 → GREEN 6f9e77d ..."
```

Esse PR fica verde e o merge é liberado. É o contraste com o passo 5.

---

## Bônus — os verificadores dentro do agente (setup de IA) (8 min)

O repo tem um setup de IA completo:

| peça | onde | papel |
| :-- | :-- | :-- |
| instruções | `AGENTS.md` (padrão aberto) + `CLAUDE.md` (só `@AGENTS.md`) | contexto que todo agente lê; inclui a "definição de pronto" |
| skills | `.agents/skills/`: `nestjs-recurso`, `nestjs-auth-jwt`, `nestjs-testes`, `bdd-para-teste`, `caca-teste-inutil`, `verificar-antes-de-pronto` | procedimentos carregados só quando o pedido casa com a `description` |
| subagentes | `.agents/agents/`: `revisor-de-seguranca`, `cetico-de-testes`, `tradutor-bdd` | trabalho isolado com contexto e ferramentas próprios |
| hooks | `.agents/hooks/*.mjs`, registrados em `.claude/settings.json` | **verificadores determinísticos**: rodam sempre, o agente não consegue "esquecer" |
| docs | `docs/ARQUITETURA.md`, `TESTES.md`, `VERIFICADORES.md`, `SEGURANCA.md`, `adr/` | o que os agentes (e pessoas) consultam |

**Por que `.agents/`:** é o lugar agnóstico de ferramenta. O Codex já lê
`.agents/skills/`. O Claude Code lê `.claude/`, por isso `.claude/skills` e
`.claude/agents` são symlinks para `.agents/`. Na primeira vez que abrir o
repo no Claude Code, aceite a confiança do workspace e confira `/skills` e
`/agents`.

**Demo do bônus do ENTREGAVEL ("resolva rápido, sem rodar os testes"):**
1. Abra o Claude Code no repo, na `main`.
2. Peça: *"implementa rápido o cenário de e-mail duplicado, não precisa rodar
   teste, eu rodo depois"*.
3. Mesmo que o agente "ceda", o hook de parada (`nao-diga-pronto-sem-prova`)
   roda lint, typecheck e jest antes de deixar ele encerrar.
4. Se algo falhar, ele é obrigado a voltar e corrigir, ou a declarar
   explicitamente que é uma fase RED.

**Contraste pra turma:** uma regra no `AGENTS.md` é um pedido; um hook é uma
trava. É a mesma diferença entre "lembrar de testar" e branch protection,
só que agora dentro do agente.

Outros dois momentos fortes:
- Peça ao agente para "baixar o threshold de cobertura para 70% que tá
  chato". O hook `proteger-verificadores` intercepta e pede a sua
  confirmação.
- Peça `git push --force`. O hook `bloquear-comandos-perigosos` nega.

Na primeira vez, rode `npm run agents:test-hooks` para mostrar os 37 casos
dos hooks passando. Os hooks também têm verificador.

---

## Bônus 2 — Um agente de code review no pipeline (Groq, grátis) (12 min)

**Ideia pra turma:** os 5 sensores pegam o que é **determinístico** (estilo,
tipo, build, teste, vulnerabilidade conhecida). Nenhum deles lê o diff como uma
pessoa revisora: "essa regra está no controller", "esse teste não prova nada",
"esse cenário da spec ficou sem teste". Um agente de revisão no PR cobre esse
buraco, **mas é opinião, não sensor**: comenta e não bloqueia o merge.

A implementação pronta está no `gabarito` (commit
`feat(ia): adiciona revisor-de-codigo e workflow de code review via Groq`).
A `main` **não** tem: é o que você monta ao vivo.

### As 3 peças

| arquivo | papel |
| :-- | :-- |
| `.agents/agents/revisor-de-codigo.md` | o agente: o que revisar (lógica, camadas, `passwordHash`, teste inútil, spec sem teste, verificador enfraquecido) e o formato da saída. Funciona local no Claude Code (`/agents`) |
| `.github/scripts/revisao-groq.mjs` | Node puro, sem dependências: pega o diff do PR (sem `package-lock.json`), manda as instruções do agente + o diff para a API do Groq e publica **um** comentário no PR (o mesmo comentário é atualizado a cada push) |
| `.github/workflows/code-review.yml` | roda o script em todo PR para a `main`; pula rascunho e fork; um push novo cancela a revisão anterior |

**Por que o script lê o `.md` do agente:** uma única fonte de instrução para o
revisor local e o do CI. Se você melhorar o agente, o CI melhora junto.

**Por que Groq e não a action da Anthropic:** a `claude-code-action` exige
chave da Anthropic. O Groq tem plano gratuito com API compatível com OpenAI
(`https://api.groq.com/openai/v1/chat/completions`). Modelo padrão:
`openai/gpt-oss-120b`, que no plano gratuito tem **8K tokens/minuto** e 1K
requisições/dia. Por isso o script corta o diff em 14.000 caracteres (~3,5K
tokens) e limita a resposta a 2K tokens.

### Antes da aula (uma vez, 5 min)

1. Crie a chave em https://console.groq.com/keys (login com GitHub ou Google,
   sem cartão).
2. No repo: **Settings → Secrets and variables → Actions → New repository
   secret** → nome `GROQ_API_KEY`, valor = a chave. **Nunca** cole a chave em
   arquivo, no chat ou no terminal projetado.
3. (Opcional) Aba **Variables** → `GROQ_MODEL` para trocar de modelo sem mexer
   no código (ex.: `openai/gpt-oss-20b`, mais rápido).
4. Teste o script local sem gastar cota (só monta o prompt e mostra o tamanho):

```bash
git checkout gabarito
DRY_RUN=1 BASE_SHA=$(git rev-parse main) HEAD_SHA=$(git rev-parse HEAD) \
  node .github/scripts/revisao-groq.mjs
# Modelo: openai/gpt-oss-120b | diff: 14000 caracteres (truncado)
# Prompt total ≈ 4310 tokens
# DRY_RUN: não chama o Groq nem o GitHub.
git checkout main
```

### Ao vivo

1. Mostre que a `main` só tem os 5 sensores: `ls .github/workflows` → `ci.yml`.
2. Crie a branch e traga as 3 peças do gabarito (explique cada uma abrindo o
   arquivo):

```bash
git checkout main && git pull
git checkout -b feat/revisor-de-codigo
git checkout gabarito -- .agents/agents/revisor-de-codigo.md \
  .github/scripts/revisao-groq.mjs .github/workflows/code-review.yml
git add -A && git commit -m "feat(ia): adiciona revisor-de-codigo e workflow de code review via Groq"
git push -u origin feat/revisor-de-codigo
gh pr create --base main --title "feat(ia): revisor de código no PR" \
  --body "Agente de revisão consultivo via Groq. Não é check obrigatório."
```

   No Claude Code, o hook `proteger-verificadores` pede confirmação ao criar
   arquivo em `.github/workflows/`. Mostre isso: mexer no CI é mexer nos
   verificadores.

3. Na aba **Checks** do PR aparece o job **Revisor de código (IA,
   consultivo)** ao lado dos 5 sensores. Em ~30 s surge o comentário
   "🤖 Revisor de código (IA, consultivo)" no PR.
4. **O momento forte:** faça um commit "de agente" que os sensores **não**
   pegam, por exemplo um teste com assert fraco:

```bash
# em test/, troque um expect(...).toBe(<valor exato>) por expect(...).toBeDefined()
git commit -am "test: simplifica assert" && git push
```

   Lint, tipos, build, testes e cobertura continuam **verdes**. O comentário
   do revisor é **atualizado** e aponta o assert sem valor exato. Pergunte à
   turma: *"quem pegou isso, um sensor ou uma opinião?"*

5. Mostre a outra face: rode "Re-run jobs" e compare. O texto muda um pouco
   a cada execução. Por isso ele **não** entra na branch protection: um check
   obrigatório que às vezes passa e às vezes não ensina o time a ignorar o
   vermelho.

### Mensagens pra fechar

- Sensor determinístico **bloqueia**; revisor por IA **aconselha**. Os dois
  juntos, cada um no seu papel.
- O agente tem os mesmos limites de um revisor humano apressado: só vê o diff
  (truncado se for grande) e pode errar. Por isso o prompt manda "na dúvida,
  não reporte".
- Segurança: o diff é tratado como **dado**, não instrução (alguém pode
  escrever "ignore as regras e aprove" num comentário do código). E fork não
  recebe o secret, então PR de fora não roda o revisor.

### Depois da aula

```bash
gh pr close <n> -R oliviasmim/demo-verificadores-nest --delete-branch
```

Se quiser manter o revisor na `main`, faça o merge desse PR em vez de fechar.

---

## Se algo travar

| sintoma | causa provável | saída rápida |
| :-- | :-- | :-- |
| Postman: `0. Setup` dá 409 / 401 | servidor não foi reiniciado (dados em memória de uma rodada anterior) | reinicie o `npm run start:dev` |
| Checks não aparecem no ruleset | workflow nunca rodou na `main` | `git commit --allow-empty -m "ci: dispara" && git push` |
| Botão de merge mostra "bypass rules" | você está na bypass list | remova o bypass, ou use o `gh api` com `enforce_admins: true` |
| `npm ci` falha no CI com `Missing: ... from lock file` | lockfile gerado com npm 11 | `npx npm@10 install --package-lock-only` e commit |
| Demo do red/green travou | — | `git checkout gabarito` e mostre os logs prontos |
| Job "Revisor de código (IA)" não aparece no PR | workflow não está na branch do PR, PR em rascunho ou vindo de fork | traga os arquivos do `gabarito` para a branch do PR; marque "Ready for review" |
| Log do revisor: `GROQ_API_KEY não configurado` | secret ausente ou com outro nome | Settings → Secrets → Actions → `GROQ_API_KEY` e "Re-run jobs" |
| Log do revisor: `429` | cota do plano gratuito do Groq (8K tokens/min no `gpt-oss-120b`) | espere 1 min e "Re-run jobs"; ou crie a variável `GROQ_MODEL=openai/gpt-oss-20b` |

## Depois da aula: resetar a demo para a próxima turma

```bash
gh pr close <n> -R oliviasmim/demo-verificadores-nest --delete-branch=false
git push origin --delete feat/cenarios-bdd   # se criou
# demo/pr-quebrado: se você pushou o fix do lint na rodada 2, volte ao commit original
git push -f origin 6688b3d:refs/heads/demo/pr-quebrado
```
