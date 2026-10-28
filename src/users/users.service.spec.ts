import { NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const dadosAna = {
    name: 'Ana',
    email: 'ana@pda.org',
    password: 'senha12345',
  };

  beforeEach(() => {
    service = new UsersService(new UsersRepository());
  });

  it('cria usuário com senha protegida', async () => {
    const user = await service.create(dadosAna);

    expect(user.passwordHash).toBeDefined();
  });

  it('cria usuário com id, nome e e-mail informados', async () => {
    const user = await service.create(dadosAna);

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.name).toBe('Ana');
    expect(user.email).toBe('ana@pda.org');
  });

  it('gera ids diferentes para usuários diferentes', async () => {
    const ana = await service.create(dadosAna);
    const bruno = await service.create({
      ...dadosAna,
      name: 'Bruno',
      email: 'bruno@pda.org',
    });

    expect(ana.id).not.toBe(bruno.id);
  });

  it('lista todos os usuários criados', async () => {
    await service.create(dadosAna);
    await service.create({ ...dadosAna, email: 'bruno@pda.org' });

    expect(service.findAll().map((u) => u.email)).toEqual([
      'ana@pda.org',
      'bruno@pda.org',
    ]);
  });

  it('busca usuário por id', async () => {
    const ana = await service.create(dadosAna);

    expect(service.findOne(ana.id).email).toBe('ana@pda.org');
  });

  it('lança NotFoundException ao buscar id inexistente', () => {
    expect(() => service.findOne('nao-existe')).toThrow(NotFoundException);
  });

  it('busca usuário por e-mail', async () => {
    await service.create(dadosAna);

    expect(service.findByEmail('ana@pda.org')?.name).toBe('Ana');
    expect(service.findByEmail('outra@pda.org')).toBeUndefined();
  });

  it('atualiza o nome sem alterar o e-mail', async () => {
    const ana = await service.create(dadosAna);

    const atualizado = await service.update(ana.id, { name: 'Ana Souza' });

    expect(atualizado.name).toBe('Ana Souza');
    expect(atualizado.email).toBe('ana@pda.org');
  });

  it('troca o hash ao atualizar a senha', async () => {
    const ana = await service.create(dadosAna);
    const hashAntigo = ana.passwordHash;

    const atualizado = await service.update(ana.id, {
      password: 'outra-senha-123',
    });

    expect(atualizado.passwordHash).not.toBe(hashAntigo);
  });

  it('lança NotFoundException ao atualizar id inexistente', async () => {
    await expect(service.update('nao-existe', { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove o usuário', async () => {
    const ana = await service.create(dadosAna);

    service.remove(ana.id);

    expect(service.findAll()).toEqual([]);
  });

  it('lança NotFoundException ao remover id inexistente', () => {
    expect(() => service.remove('nao-existe')).toThrow(NotFoundException);
  });
});
