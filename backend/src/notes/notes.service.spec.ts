import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotesService', () => {
  let service: NotesService;
  let prisma: {
    note: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const userId = 'user-uuid';
  const noteId = 'note-uuid';

  beforeEach(async () => {
    prisma = {
      note: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('cria uma anotação com sucesso', async () => {
      const dto = { title: 'Nota de Aula', content: 'Aprender NestJS' };
      prisma.note.create.mockResolvedValue({ id: noteId, userId, ...dto });

      const result = await service.create(userId, dto);

      expect(prisma.note.create).toHaveBeenCalledWith({
        data: {
          userId,
          title: dto.title,
          content: dto.content,
        },
      });
      expect(result).toHaveProperty('id', noteId);
    });

    it('cria uma anotação sem título (titulo nulo)', async () => {
      const dto = { content: 'Sem título' };
      prisma.note.create.mockResolvedValue({ id: noteId, userId, title: null, ...dto });

      const result = await service.create(userId, dto);

      expect(prisma.note.create).toHaveBeenCalledWith({
        data: {
          userId,
          title: null,
          content: dto.content,
        },
      });
      expect(result.title).toBeNull();
    });
  });

  describe('findAll', () => {
    it('retorna todas as anotações do usuário ordenadas por updatedAt', async () => {
      const notes = [
        { id: '1', userId, title: 'Nota 1', content: 'C1', updatedAt: new Date() },
        { id: '2', userId, title: 'Nota 2', content: 'C2', updatedAt: new Date() },
      ];
      prisma.note.findMany.mockResolvedValue(notes);

      const result = await service.findAll(userId);

      expect(prisma.note.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('atualiza uma anotação existente', async () => {
      const existing = { id: noteId, userId, title: 'Nota Antiga', content: 'C1' };
      prisma.note.findFirst.mockResolvedValue(existing);
      
      const dto = { title: 'Nota Nova', content: 'C2' };
      prisma.note.update.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update(userId, noteId, dto);

      expect(prisma.note.findFirst).toHaveBeenCalledWith({ where: { id: noteId, userId } });
      expect(prisma.note.update).toHaveBeenCalledWith({
        where: { id: noteId },
        data: { title: dto.title, content: dto.content },
      });
      expect(result.title).toBe('Nota Nova');
    });

    it('lança NotFoundException se a anotação não existir ou não pertencer ao usuário', async () => {
      prisma.note.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, noteId, { title: 'Novo' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('exclui uma anotação existente', async () => {
      const existing = { id: noteId, userId, title: 'Deletar', content: 'C' };
      prisma.note.findFirst.mockResolvedValue(existing);
      prisma.note.delete.mockResolvedValue(existing);

      const result = await service.remove(userId, noteId);

      expect(prisma.note.findFirst).toHaveBeenCalledWith({ where: { id: noteId, userId } });
      expect(prisma.note.delete).toHaveBeenCalledWith({ where: { id: noteId } });
      expect(result).toEqual({ deleted: true });
    });

    it('lança NotFoundException na exclusão se a anotação não pertencer ao usuário', async () => {
      prisma.note.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(userId, noteId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
