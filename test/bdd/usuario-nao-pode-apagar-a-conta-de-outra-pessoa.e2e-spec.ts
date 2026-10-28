import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from '../helpers/criar-app';

async function cadastrarELogar(
  app: INestApplication<App>,
  name: string,
  email: string,
): Promise<{ id: string; token: string }> {
  const cadastro = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ name, email, password: 'senha12345' })
    .expect(201);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'senha12345' })
    .expect(200);
  return {
    id: (cadastro.body as { id: string }).id,
    token: (login.body as { access_token: string }).access_token,
  };
}

// Cenário BDD: docs/specs/features/consulta-e-gestao-de-usuarios.feature
describe('Consulta e gestão de usuários (BDD)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('usuário não pode apagar a conta de outra pessoa', async () => {
    // Dado que Ana e Bruno estão cadastrados
    // E que Bruno está autenticado
    const ana = await cadastrarELogar(app, 'Ana', 'ana@pda.org');
    const bruno = await cadastrarELogar(app, 'Bruno', 'bruno@pda.org');

    // Quando Bruno envia DELETE /users/{idAna} com o token do Bruno
    const resposta = await request(app.getHttpServer())
      .delete(`/users/${ana.id}`)
      .set('Authorization', `Bearer ${bruno.token}`);

    // Então a resposta tem status 403
    expect(resposta.status).toBe(403);

    // E a conta da Ana continua existindo: GET /users/{idAna} com o token da Ana devolve 200
    await request(app.getHttpServer())
      .get(`/users/${ana.id}`)
      .set('Authorization', `Bearer ${ana.token}`)
      .expect(200);
  });
});
