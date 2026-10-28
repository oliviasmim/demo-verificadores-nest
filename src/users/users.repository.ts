import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

// Repositório em memória. Cada instância (ou seja, cada app Nest) tem o seu
// próprio estado; trocar por TypeORM/Prisma só exige reescrever esta classe.
@Injectable()
export class UsersRepository {
  private readonly users: User[] = [];

  insert(user: User): User {
    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return [...this.users];
  }

  findById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  update(id: string, changes: Partial<Omit<User, 'id'>>): User | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    Object.assign(user, changes);
    return user;
  }

  delete(id: string): boolean {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
