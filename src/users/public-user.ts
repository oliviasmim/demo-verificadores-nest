import { User } from './user.entity';

// O que a API pode mostrar de um usuário: tudo, menos o hash da senha.
export type PublicUser = Omit<User, 'passwordHash'>;

// Único lugar que decide o que sai de um usuário nas respostas da API.
export function toPublicUser(user: User): PublicUser {
  const publico: Partial<User> = { ...user };
  delete publico.passwordHash;
  return publico as PublicUser;
}
