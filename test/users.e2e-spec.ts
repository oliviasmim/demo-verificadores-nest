import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from './helpers/criar-app';

interface UsuarioResposta {
  id: string;
  name: string;
  email: string;
}

async function cadastrarELogar(
  app: INestApplication<App>,
  name: string,
  email: string,
): Promise<{ id: string; token: string }> {
  const cadastro = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ name, email, password: 'senha12345' });
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'senha12345' });
  return {
    id: (cadastro.body as UsuarioResposta).id,
    token: (login.body as { access_token: string }).access_token,
  };
}

describe('Usuários (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('listar usuários sem token é recusado', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('buscar usuário por id sem token é recusado', async () => {
    await request(app.getHttpServer()).get('/users/qualquer-id').expect(401);
  });

  it('listar usuários com token devolve os usuários cadastrados', async () => {
    const ana = await cadastrarELogar(app, 'Ana', 'ana@pda.org');
    await cadastrarELogar(app, 'Bruno', 'bruno@pda.org');

    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${ana.token}`)
      .expect(200);

    const nomes = (res.body as UsuarioResposta[]).map((u) => u.name);
    expect(nomes).toEqual(['Ana', 'Bruno']);
  });

  it('GET /users/me devolve o usuário logado', async () => {
    await cadastrarELogar(app, 'Ana', 'ana@pda.org');
    const bruno = await cadastrarELogar(app, 'Bruno', 'bruno@pda.org');

    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${bruno.token}`)
      .expect(200);

    expect((res.body as UsuarioResposta).email).toBe('bruno@pda.org');
  });

  it('buscar usuário por id devolve o usuário', async () => {
    const ana = await cadastrarELogar(app, 'Ana', 'ana@pda.org');

    const res = await request(app.getHttpServer())
      .get(`/users/${ana.id}`)
      .set('Authorization', `Bearer ${ana.token}`)
      .expect(200);

    expect((res.body as UsuarioResposta).name).toBe('Ana');
  });

  it('buscar usuário inexistente devolve 404', async () => {
    const ana = await cadastrarELogar(app, 'Ana', 'ana@pda.org');

    await request(app.getHttpServer())
      .get('/users/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${ana.token}`)
      .expect(404);
  });

  it('atualizar o nome do usuário persiste a mudança', async () => {
    const ana = await cadastrarELogar(app, 'Ana', 'ana@pda.org');

    const res = await request(app.getHttpServer())
      .patch(`/users/${ana.id}`)
      .set('Authorization', `Bearer ${ana.token}`)
      .send({ name: 'Ana Souza' })
      .expect(200);

    const body = res.body as UsuarioResposta;
    expect(body.name).toBe('Ana Souza');
    expect(body.email).toBe('ana@pda.org');
  });

  it('atualizar a senha permite login com a nova senha', async () => {
    const ana = await cadastrarELogar(app, 'Ana', 'ana@pda.org');

    await request(app.getHttpServer())
      .patch(`/users/${ana.id}`)
      .set('Authorization', `Bearer ${ana.token}`)
      .send({ password: 'nova-senha-123' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@pda.org', password: 'nova-senha-123' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@pda.org', password: 'senha12345' })
      .expect(401);
  });

  it('apagar a própria conta devolve 204 e o usuário deixa de existir', async () => {
    const ana = await cadastrarELogar(app, 'Ana', 'ana@pda.org');
    const bruno = await cadastrarELogar(app, 'Bruno', 'bruno@pda.org');

    await request(app.getHttpServer())
      .delete(`/users/${ana.id}`)
      .set('Authorization', `Bearer ${ana.token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/users/${ana.id}`)
      .set('Authorization', `Bearer ${bruno.token}`)
      .expect(404);
  });
});
