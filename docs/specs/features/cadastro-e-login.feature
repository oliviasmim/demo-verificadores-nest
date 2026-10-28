# language: pt
Funcionalidade: Cadastro e login de usuários

  Cenário: cadastro com dados válidos cria o usuário
    Dado que não existe usuário com o e-mail "ana@pda.org"
    Quando envio POST /auth/register com nome "Ana", e-mail "ana@pda.org" e senha "senha12345"
    Então a resposta tem status 201
    E o corpo contém o nome "Ana" e o e-mail "ana@pda.org"

  Cenário: cadastro com e-mail inválido é recusado
    Quando envio POST /auth/register com e-mail "isso-nao-e-email"
    Então a resposta tem status 400

  Cenário: cadastro com senha curta é recusado
    Quando envio POST /auth/register com a senha "1234567" (7 caracteres)
    Então a resposta tem status 400

  Cenário: login com credenciais válidas devolve um token de acesso
    Dado que "ana@pda.org" está cadastrada com a senha "senha12345"
    Quando envio POST /auth/login com "ana@pda.org" e "senha12345"
    Então a resposta tem status 200
    E o corpo contém "access_token"

  Cenário: login com senha errada é recusado com mensagem genérica
    Dado que "ana@pda.org" está cadastrada com a senha "senha12345"
    Quando envio POST /auth/login com "ana@pda.org" e "senha-errada"
    Então a resposta tem status 401
    E a mensagem é "Credenciais inválidas"

  Cenário: login com e-mail inexistente é recusado com a mesma mensagem genérica
    Dado que não existe usuário com o e-mail "ninguem@pda.org"
    Quando envio POST /auth/login com "ninguem@pda.org" e "senha12345"
    Então a resposta tem status 401
    E a mensagem é "Credenciais inválidas"

  # ---------------------------------------------------------------------
  # Implementado na aula 15
  # Teste: test/bdd/cadastro-com-email-ja-cadastrado-e-recusado.e2e-spec.ts
  # ---------------------------------------------------------------------

  Cenário: cadastro com e-mail já cadastrado é recusado
    Dado que "ana@pda.org" já está cadastrada
    Quando envio POST /auth/register com nome "Outra Ana", e-mail "ana@pda.org" e senha "senha12345"
    Então a resposta tem status 409
    E existe apenas 1 usuário com o e-mail "ana@pda.org"
