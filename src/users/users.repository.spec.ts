import { User } from './user.entity';
import { UsersRepository } from './users.repository';

function novoUsuario(id: string, email: string): User {
  return {
    id,
    name: `Usuário ${id}`,
    email,
    passwordHash: 'hash',
    createdAt: new Date('2025-01-01T00:00:00Z'),
  };
}

describe('UsersRepository', () => {
  let repository: UsersRepository;

  beforeEach(() => {
    repository = new UsersRepository();
  });

  it('começa vazio', () => {
    expect(repository.findAll()).toEqual([]);
  });

  it('insere e encontra usuário por id', () => {
    const user = novoUsuario('1', 'ana@pda.org');
    repository.insert(user);
    expect(repository.findById('1')).toBe(user);
  });

  it('encontra usuário por e-mail', () => {
    repository.insert(novoUsuario('1', 'ana@pda.org'));
    repository.insert(novoUsuario('2', 'bruno@pda.org'));
    expect(repository.findByEmail('bruno@pda.org')?.id).toBe('2');
  });

  it('devolve undefined quando o id não existe', () => {
    expect(repository.findById('inexistente')).toBeUndefined();
  });

  it('atualiza apenas os campos informados', () => {
    repository.insert(novoUsuario('1', 'ana@pda.org'));
    const atualizado = repository.update('1', { name: 'Ana Souza' });
    expect(atualizado?.name).toBe('Ana Souza');
    expect(atualizado?.email).toBe('ana@pda.org');
  });

  it('update devolve undefined para id inexistente', () => {
    expect(repository.update('x', { name: 'Ninguém' })).toBeUndefined();
  });

  it('remove o usuário e informa se removeu', () => {
    repository.insert(novoUsuario('1', 'ana@pda.org'));
    expect(repository.delete('1')).toBe(true);
    expect(repository.delete('1')).toBe(false);
    expect(repository.findAll()).toEqual([]);
  });

  it('findAll devolve uma cópia da lista', () => {
    repository.insert(novoUsuario('1', 'ana@pda.org'));
    repository.findAll().pop();
    expect(repository.findAll()).toHaveLength(1);
  });
});
