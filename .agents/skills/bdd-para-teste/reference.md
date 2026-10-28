# Template do log (copie para `LOG-RED-GREEN-REFACTOR-<n>.md`)

Um log por cenário. Este log só vale se **prova a ordem**, não se narra a
ordem: o commit do teste falhando tem que existir no histórico **antes** do
commit da implementação.

---

# LOG-RED-GREEN-REFACTOR — <seu nome> / <nome do cenário>

## Cenário

(Cole aqui o cenário Dado/Quando/Então, igual está no arquivo `.feature`.)

## RED — o teste que ainda não passa

**Commit do teste (só o teste, nada de `src/`):**

```
<hash curto e mensagem, ex.:>
a1b2c3d test: red - <frase do cenário> (falha, esperado)
```

**Saída do terminal rodando o teste (colada, não resumida):**

```
<saída completa de `npx jest test/bdd/<slug>.e2e-spec.ts`, incluindo o erro/falha>
```

**Por que esperávamos que falhasse assim:** (1-2 frases: a implementação ainda
não existe, ou existe mas não trata esse caso)

## GREEN — o menor código que faz passar

**Commit da implementação:**

```
<hash curto> feat: green - <descrição> (teste passa)
```

**Saída do terminal com o teste passando:**

```
<saída completa, verde>
```

**O que você implementou e por que é o mínimo:** (1-3 frases)

## REFACTOR — o que você limpou (se houve)

**Commit do refactor (se houve):**

```
<hash curto> refactor: <descrição>
```

**O que mudou e por que o comportamento continua o mesmo:** (1-2 frases)

**Confirmação:** testes rodados de novo depois do refactor, ainda verdes?
`[ ] sim` `[ ] não, e por isso desfiz`

---

## Verificação de ordem (obrigatório)

Cole a saída de:

```bash
git log --oneline -- <arquivo(s) de teste> <arquivo(s) de implementação>
```

O commit do teste (red) tem que aparecer **antes** (mais antigo) do commit da
implementação (green). Se não aparecer nessa ordem, o ciclo não aconteceu de
verdade: refaça o ciclo, dessa vez commitando o teste falhando primeiro.

---

# Dicas rápidas

- Falhas de RED válidas: `Expected: 409, Received: 201`; `expect(received).not.toHaveProperty(...)`.
- Falhas de RED inválidas (não contam): `Cannot find module`, erro de TypeScript, `app.init` quebrado.
- Comando para só um arquivo: `npx jest test/bdd/<slug>.e2e-spec.ts`; só um teste: `npx jest -t "<frase>"`.
