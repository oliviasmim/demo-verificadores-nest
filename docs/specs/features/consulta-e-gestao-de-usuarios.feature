# language: pt
Funcionalidade: Consulta e gestão de usuários

  Cenário: listar usuários sem token é recusado
    Quando envio GET /users sem o cabeçalho Authorization
    Então a resposta tem status 401

  Cenário: listar usuários com token devolve os usuários cadastrados
    Dado que "Ana" e "Bruno" estão cadastrados
    E que Ana está autenticada
    Quando envio GET /users com o token da Ana
    Então a resposta tem status 200
    E os nomes listados são "Ana" e "Bruno"

  Cenário: GET /users/me devolve o usuário logado
    Dado que "Ana" e "Bruno" estão cadastrados
    E que Bruno está autenticado
    Quando envio GET /users/me com o token do Bruno
    Então a resposta tem status 200
    E o e-mail devolvido é "bruno@pda.org"

  Cenário: buscar usuário por id devolve o usuário
    Dado que Ana está cadastrada e autenticada
    Quando envio GET /users/{idAna} com o token da Ana
    Então a resposta tem status 200
    E o nome devolvido é "Ana"

  Cenário: buscar usuário inexistente devolve 404
    Dado que Ana está autenticada
    Quando envio GET /users/00000000-0000-4000-8000-000000000000
    Então a resposta tem status 404

  Cenário: atualizar o nome do usuário persiste a mudança
    Dado que Ana está cadastrada e autenticada
    Quando envio PATCH /users/{idAna} com o nome "Ana Souza"
    Então a resposta tem status 200
    E o nome devolvido é "Ana Souza" e o e-mail continua "ana@pda.org"

  Cenário: apagar a própria conta devolve 204 e o usuário deixa de existir
    Dado que Ana e Bruno estão cadastrados e autenticados
    Quando Ana envia DELETE /users/{idAna} com o próprio token
    Então a resposta tem status 204
    E GET /users/{idAna} devolve 404

  # ---------------------------------------------------------------------
  # Implementado na aula 15
  # Teste: test/bdd/a-senha-nunca-aparece-nas-respostas-da-api.e2e-spec.ts
  # ---------------------------------------------------------------------

  Cenário: a senha nunca aparece nas respostas da API
    Dado que Ana está cadastrada e autenticada
    Quando envio GET /users/{idAna} com o token da Ana
    Então a resposta tem status 200
    E o corpo não contém o campo "password"
    E o corpo não contém o campo "passwordHash"

  # Teste: test/bdd/usuario-nao-pode-apagar-a-conta-de-outra-pessoa.e2e-spec.ts
  Cenário: usuário não pode apagar a conta de outra pessoa
    Dado que Ana e Bruno estão cadastrados
    E que Bruno está autenticado
    Quando Bruno envia DELETE /users/{idAna} com o token do Bruno
    Então a resposta tem status 403
    E a conta da Ana continua existindo: GET /users/{idAna} com o token da Ana devolve 200
