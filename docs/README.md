# Documentação do projeto

Índice da pasta `docs/`. Para o resumo operacional (comandos, convenções,
definição de pronto), comece pelo [`AGENTS.md`](../AGENTS.md) na raiz.

| Documento | Para que serve |
|---|---|
| [`ARQUITETURA.md`](./ARQUITETURA.md) | Módulos, fluxo de uma requisição, onde fica cada coisa, como trocar o repositório em memória por um banco |
| [`TESTES.md`](./TESTES.md) | Pirâmide de testes, como rodar, piso de cobertura, como checar se um teste prova alguma coisa |
| [`VERIFICADORES.md`](./VERIFICADORES.md) | Os 5 sensores do CI, o que cada um pega (e o que não pega) |
| [`SEGURANCA.md`](./SEGURANCA.md) | Regras de segurança da API e o que a spec ainda exige |
| [`adr/`](./adr/) | Decisões de arquitetura (Contexto, Decisão, Consequências) |
| [`specs/`](./specs/) | Spec em EARS e cenários BDD (`.feature`): a fonte da verdade do comportamento |

Setup de IA (skills, subagentes, hooks): [`.agents/README.md`](../.agents/README.md).
