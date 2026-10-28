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
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@pda.org', password: 'senha12345' })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@pda.org', password: 'senha12345' })
      .expect(200);
    const token = (login.body as { access_token: string }).access_token;

    // Quando envio POST /auth/register com nome "Outra Ana", e-mail "ana@pda.org" e senha "senha12345"
    const resposta = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Outra Ana',
        email: 'ana@pda.org',
        password: 'senha12345',
      });

    // Então a resposta tem status 409
    expect(resposta.status).toBe(409);

    // E existe apenas 1 usuário com o e-mail "ana@pda.org"
    const lista = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const comEsseEmail = (lista.body as { email: string }[]).filter(
      (u) => u.email === 'ana@pda.org',
    );
    expect(comEsseEmail).toHaveLength(1);
  });
});
