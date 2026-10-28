import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UsersRepository } from './users.repository';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (this.repository.findByEmail(dto.email)) {
      throw new ConflictException('E-mail já cadastrado');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.repository.insert({
      id: randomUUID(),
      name: dto.name,
      email: dto.email,
      passwordHash,
      createdAt: new Date(),
    });
  }

  findAll(): User[] {
    return this.repository.findAll();
  }

  findOne(id: string): User {
    const user = this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.repository.findByEmail(email);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    this.findOne(id);
    const { password, ...rest } = dto;
    // Campos ausentes no DTO chegam como undefined: não podem sobrescrever o que já existe.
    const changes: Partial<User> = Object.fromEntries(
      Object.entries(rest).filter(([, valor]) => valor !== undefined),
    );
    if (password) {
      changes.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    const updated = this.repository.update(id, changes);
    return updated as User;
  }

  remove(id: string): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
