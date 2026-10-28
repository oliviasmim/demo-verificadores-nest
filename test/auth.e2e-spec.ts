import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from './helpers/criar-app';

const ana = { name: 'Ana', email: 'ana@pda.org', password: 'senha12345' };

describe('Autenticação (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('cadastro com dados válidos cria o usuário', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(ana)
      .expect(201);

    const body = res.body as { id: string; name: string; email: string };
    expect(body.name).toBe('Ana');
    expect(body.email).toBe('ana@pda.org');
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('login com credenciais válidas devolve um token de acesso', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(ana);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ana.email, password: ana.password })
      .expect(200);

    const body = res.body as { access_token: string };
    expect(body.access_token.split('.')).toHaveLength(3);
  });

  it('login com senha errada é recusado com mensagem genérica', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(ana);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ana.email, password: 'senha-errada' })
      .expect(401);

    expect((res.body as { message: string }).message).toBe(
      'Credenciais inválidas',
    );
  });

  it('login com e-mail inexistente é recusado com a mesma mensagem genérica', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ninguem@pda.org', password: 'senha12345' })
      .expect(401);

    expect((res.body as { message: string }).message).toBe(
      'Credenciais inválidas',
    );
  });

  it('cadastro com e-mail inválido é recusado', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...ana, email: 'isso-nao-e-email' })
      .expect(400);
  });

  it('cadastro com senha curta é recusado', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...ana, password: '1234567' })
      .expect(400);
  });
});
