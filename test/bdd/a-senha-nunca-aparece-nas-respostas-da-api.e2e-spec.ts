import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from '../helpers/criar-app';

const CAMPOS_PROIBIDOS = ['password', 'passwordHash'];

// Percorre o corpo inteiro (objetos e listas) e devolve os campos proibidos
// encontrados, no formato "ROTA -> campo". Lista vazia = nada vazou.
function vazamentos(rota: string, corpo: unknown): string[] {
  if (Array.isArray(corpo)) {
    return corpo.flatMap((item) => vazamentos(rota, item));
  }
  if (corpo !== null && typeof corpo === 'object') {
    return Object.entries(corpo).flatMap(([campo, valor]) => [
      ...(CAMPOS_PROIBIDOS.includes(campo) ? [`${rota} -> ${campo}`] : []),
      ...vazamentos(rota, valor),
    ]);
  }
  return [];
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

  it('a senha nunca aparece nas respostas da API', async () => {
    // Dado que Ana está cadastrada e autenticada
    const cadastro = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@pda.org', password: 'senha12345' })
      .expect(201);
    const idAna = (cadastro.body as { id: string }).id;
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@pda.org', password: 'senha12345' })
      .expect(200);
    const auth = `Bearer ${(login.body as { access_token: string }).access_token}`;

    // Quando envio GET /users/{idAna} com o token da Ana
    // (e, para cobrir toda a API, as outras rotas que devolvem usuário)
    const porId = await request(app.getHttpServer())
      .get(`/users/${idAna}`)
      .set('Authorization', auth);
    const lista = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', auth);
    const eu = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', auth);
    const atualizado = await request(app.getHttpServer())
      .patch(`/users/${idAna}`)
      .set('Authorization', auth)
      .send({ name: 'Ana Souza', password: 'outra-senha-123' });

    // Então a resposta tem status 200
    expect(porId.status).toBe(200);
    expect(lista.status).toBe(200);
    expect(eu.status).toBe(200);
    expect(atualizado.status).toBe(200);

    // E o corpo não contém o campo "password"
    // E o corpo não contém o campo "passwordHash"
    expect([
      ...vazamentos('POST /auth/register', cadastro.body),
      ...vazamentos('GET /users/:id', porId.body),
      ...vazamentos('GET /users', lista.body),
      ...vazamentos('GET /users/me', eu.body),
      ...vazamentos('PATCH /users/:id', atualizado.body),
    ]).toEqual([]);
  });
});
