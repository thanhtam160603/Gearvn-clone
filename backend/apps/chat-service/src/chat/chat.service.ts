import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { ChatUser } from './chat-user';
import type { ConversationView, Page } from './chat-view';
import { toMessageView, type MessageView } from './message-view';

@Injectable()
export class ChatService {
  constructor(private readonly db: PrismaService) {}

  async getOrCreateCurrent(customerId: string): Promise<ConversationView> {
    const where = { customerId, status: 'OPEN' as const };

    const current = await this.db.conversation.findFirst({ where });
    if (current) return current;

    try {
      return await this.db.conversation.create({
        data: {
          customerId,
          participants: {
            create: { userId: customerId, role: 'CUSTOMER' },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const winner = await this.db.conversation.findFirst({ where });
        if (winner) return winner;
      }
      throw error;
    }
  }

  async getCurrent(customerId: string): Promise<ConversationView> {
    const current = await this.db.conversation.findFirst({
      where: { customerId, status: 'OPEN' },
    });
    if (!current) throw new NotFoundException('Chưa có hội thoại đang mở');
    return current;
  }

  async listForSupport(
    _supportId: string,
    cursor?: string,
    limit = 20,
  ): Promise<Page<ConversationView>> {
    const anchor = cursor
      ? await this.db.conversation.findUnique({ where: { id: cursor } })
      : null;
    if (cursor && (!anchor || anchor.status !== 'OPEN')) {
      throw new BadRequestException('Cursor không hợp lệ');
    }

    const rows = await this.db.conversation.findMany({
      where: {
        status: 'OPEN',
        ...(anchor
          ? {
              OR: [
                { updatedAt: { lt: anchor.updatedAt } },
                { updatedAt: anchor.updatedAt, id: { lt: anchor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const items = rows.slice(0, limit);
    return {
      items,
      nextCursor: rows.length > limit ? items.at(-1)!.id : null,
    };
  }

  async claimForSupport(
    conversationId: string,
    supportId: string,
  ): Promise<ConversationView> {
    const claimed = await this.db.$transaction(async (tx) => {
      const update = await tx.conversation.updateMany({
        where: { id: conversationId, status: 'OPEN', assignedSupportId: null },
        data: { assignedSupportId: supportId },
      });
      if (update.count !== 1) return null;
      await tx.conversationParticipant.create({
        data: { conversationId, userId: supportId, role: 'SUPPORT' },
      });
      return tx.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    });
    if (claimed) return claimed;

    const current = await this.db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!current) throw new NotFoundException('Hội thoại không tồn tại');
    if (current.status !== 'OPEN') {
      throw new ConflictException('CONVERSATION_CLOSED');
    }
    if (current.assignedSupportId === supportId) return current;
    throw new ConflictException('CONVERSATION_ASSIGNED');
  }

  async closeForSupport(
    conversationId: string,
    supportId: string,
  ): Promise<ConversationView> {
    const update = await this.db.conversation.updateMany({
      where: { id: conversationId, status: 'OPEN', assignedSupportId: supportId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    const current = await this.db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!current) throw new NotFoundException('Hội thoại không tồn tại');
    if (current.assignedSupportId !== supportId) {
      throw new NotFoundException('Hội thoại không tồn tại');
    }
    if (update.count === 1 || current.status === 'CLOSED') return current;
    throw new ConflictException('CONVERSATION_STATE_CONFLICT');
  }

  async assertParticipant(
    conversationId: string,
    actor: ChatUser,
  ): Promise<ConversationView> {
    const conversation = await this.db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Hội thoại không tồn tại');
    if (actor.role === 'CUSTOMER' && conversation.customerId === actor.id) {
      return conversation;
    }
    if (actor.role === 'SUPPORT' && conversation.assignedSupportId === actor.id) {
      const participant = await this.db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId: actor.id },
        },
      });
      if (participant) return conversation;
    }
    throw new NotFoundException('Hội thoại không tồn tại');
  }

  async authorizeJoin(
    conversationId: string,
    actor: ChatUser,
  ): Promise<{ conversationId: string }> {
    const conversation = await this.assertParticipant(conversationId, actor);
    if (conversation.status !== 'OPEN') {
      throw new ConflictException('CONVERSATION_CLOSED');
    }
    return { conversationId };
  }

  async listMessages(
    conversationId: string,
    actor: ChatUser,
    cursor?: string,
    limit = 20,
  ): Promise<Page<MessageView>> {
    await this.assertParticipant(conversationId, actor);
    const anchor = cursor
      ? await this.db.message.findUnique({ where: { id: cursor } })
      : null;
    if (cursor && (!anchor || anchor.conversationId !== conversationId)) {
      throw new BadRequestException('Cursor không thuộc hội thoại');
    }
    const rows = await this.db.message.findMany({
      where: {
        conversationId,
        ...(anchor
          ? {
              OR: [
                { createdAt: { lt: anchor.createdAt } },
                { createdAt: anchor.createdAt, id: { lt: anchor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const items = rows.slice(0, limit).map(toMessageView);
    return {
      items,
      nextCursor: rows.length > limit ? items.at(-1)!.id : null,
    };
  }

  async saveMessage(
    conversationId: string,
    actor: ChatUser,
    clientMessageId: string,
    body: string,
  ): Promise<{ message: MessageView; created: boolean }> {
    await this.assertParticipant(conversationId, actor);
    const normalizedBody = body.trim();
    if (!normalizedBody || normalizedBody.length > 2000) {
      throw new BadRequestException('Nội dung tin nhắn không hợp lệ');
    }
    const key = { senderId: actor.id, clientMessageId };
    const existing = await this.db.message.findUnique({
      where: { senderId_clientMessageId: key },
    });
    if (existing) {
      if (existing.conversationId !== conversationId || existing.body !== normalizedBody) {
        throw new ConflictException('CLIENT_MESSAGE_ID_CONFLICT');
      }
      return { message: toMessageView(existing), created: false };
    }

    try {
      const row = await this.db.$transaction(async (tx) => {
        const update = await tx.conversation.updateMany({
          where: { id: conversationId, status: 'OPEN' },
          data: { updatedAt: new Date() },
        });
        if (update.count !== 1) {
          throw new ConflictException('CONVERSATION_CLOSED');
        }
        return tx.message.create({
          data: {
            conversationId,
            senderId: actor.id,
            clientMessageId,
            body: normalizedBody,
          },
        });
      });
      return { message: toMessageView(row), created: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const prior = await this.db.message.findUnique({
          where: { senderId_clientMessageId: key },
        });
        if (
          prior &&
          prior.conversationId === conversationId &&
          prior.body === normalizedBody
        ) {
          return { message: toMessageView(prior), created: false };
        }
        throw new ConflictException('CLIENT_MESSAGE_ID_CONFLICT');
      }
      throw error;
    }
  }
}
