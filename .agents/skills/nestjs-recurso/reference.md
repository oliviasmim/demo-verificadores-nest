# Esqueletos: recurso `tarefas`

Troque `tarefas`/`Tarefa` pelo nome do seu recurso. Estilo igual ao de `src/users/`.

## `src/tarefas/tarefa.entity.ts`

```ts
export class Tarefa {
  id!: string;
  titulo!: string;
  concluida!: boolean;
  donoId!: string;
  createdAt!: Date;
}
```

## `src/tarefas/dto/create-tarefa.dto.ts`

```ts
import { IsString, MinLength } from 'class-validator';

export class CreateTarefaDto {
  @IsString()
  @MinLength(1)
  titulo!: string;
}
```

## `src/tarefas/dto/update-tarefa.dto.ts`

```ts
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTarefaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  @IsOptional()
  @IsBoolean()
  concluida?: boolean;
}
```

## `src/tarefas/tarefas.repository.ts`

```ts
import { Injectable } from '@nestjs/common';
import { Tarefa } from './tarefa.entity';

// Estado na instância (não em variável de módulo): cada app de teste nasce limpo.
@Injectable()
export class TarefasRepository {
  private readonly tarefas: Tarefa[] = [];

  insert(tarefa: Tarefa): Tarefa {
    this.tarefas.push(tarefa);
    return tarefa;
  }

  findAll(): Tarefa[] {
    return [...this.tarefas];
  }

  findById(id: string): Tarefa | undefined {
    return this.tarefas.find((t) => t.id === id);
  }

  update(id: string, changes: Partial<Omit<Tarefa, 'id'>>): Tarefa | undefined {
    const tarefa = this.findById(id);
    if (!tarefa) return undefined;
    Object.assign(tarefa, changes);
    return tarefa;
  }

  delete(id: string): boolean {
    const index = this.tarefas.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tarefas.splice(index, 1);
    return true;
  }
}
```

## `src/tarefas/tarefas.service.ts`

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { Tarefa } from './tarefa.entity';
import { TarefasRepository } from './tarefas.repository';

@Injectable()
export class TarefasService {
  constructor(private readonly repository: TarefasRepository) {}

  create(donoId: string, dto: CreateTarefaDto): Tarefa {
    return this.repository.insert({
      id: randomUUID(),
      titulo: dto.titulo,
      concluida: false,
      donoId,
      createdAt: new Date(),
    });
  }

  findAll(): Tarefa[] {
    return this.repository.findAll();
  }

  findOne(id: string): Tarefa {
    const tarefa = this.repository.findById(id);
    if (!tarefa) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return tarefa;
  }

  update(id: string, dto: UpdateTarefaDto): Tarefa {
    this.findOne(id);
    // Campos ausentes no DTO chegam como undefined: não podem sobrescrever o que já existe.
    const changes: Partial<Tarefa> = Object.fromEntries(
      Object.entries(dto).filter(([, valor]) => valor !== undefined),
    );
    return this.repository.update(id, changes) as Tarefa;
  }

  remove(id: string): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
```

## `src/tarefas/tarefas.controller.ts`

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { Tarefa } from './tarefa.entity';
import { TarefasService } from './tarefas.service';

@UseGuards(JwtAuthGuard)
@Controller('tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTarefaDto): Tarefa {
    return this.tarefasService.create(req.user.id, dto);
  }

  @Get()
  findAll(): Tarefa[] {
    return this.tarefasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Tarefa {
    return this.tarefasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTarefaDto): Tarefa {
    return this.tarefasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.tarefasService.remove(id);
  }
}
```

## `src/tarefas/tarefas.module.ts`

```ts
import { Module } from '@nestjs/common';
import { TarefasController } from './tarefas.controller';
import { TarefasRepository } from './tarefas.repository';
import { TarefasService } from './tarefas.service';

@Module({
  controllers: [TarefasController],
  providers: [TarefasService, TarefasRepository],
})
export class TarefasModule {}
```

## `src/app.module.ts` (acrescente o módulo)

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TarefasModule } from './tarefas/tarefas.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, AuthModule, TarefasModule],
})
export class AppModule {}
```

## `test/tarefas.e2e-spec.ts`

```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from './helpers/criar-app';

async function logar(app: INestApplication<App>): Promise<string> {
  const ana = { name: 'Ana', email: 'ana@pda.org', password: 'senha12345' };
  await request(app.getHttpServer()).post('/auth/register').send(ana);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: ana.email, password: ana.password });
  return (login.body as { access_token: string }).access_token;
}

describe('Tarefas (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('listar tarefas sem token é recusado', async () => {
    await request(app.getHttpServer()).get('/tarefas').expect(401);
  });

  it('criar tarefa devolve 201 com o título informado e concluida=false', async () => {
    const token = await logar(app);

    const res = await request(app.getHttpServer())
      .post('/tarefas')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Estudar Nest' })
      .expect(201);

    const body = res.body as { titulo: string; concluida: boolean };
    expect(body.titulo).toBe('Estudar Nest');
    expect(body.concluida).toBe(false);
  });

  it('criar tarefa sem título é recusado com 400', async () => {
    const token = await logar(app);

    await request(app.getHttpServer())
      .post('/tarefas')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });
});
```

## `src/tarefas/tarefas.service.spec.ts` (trecho)

```ts
import { NotFoundException } from '@nestjs/common';
import { TarefasRepository } from './tarefas.repository';
import { TarefasService } from './tarefas.service';

describe('TarefasService', () => {
  let service: TarefasService;

  beforeEach(() => {
    service = new TarefasService(new TarefasRepository());
  });

  it('cria tarefa não concluída para o dono informado', () => {
    const tarefa = service.create('dono-1', { titulo: 'Estudar Nest' });

    expect(tarefa.titulo).toBe('Estudar Nest');
    expect(tarefa.concluida).toBe(false);
    expect(tarefa.donoId).toBe('dono-1');
  });

  it('lança NotFoundException ao buscar id inexistente', () => {
    expect(() => service.findOne('nao-existe')).toThrow(NotFoundException);
  });
});
```
