import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationEvent } from 'src/shared/events/notification-event.types';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}
  async emitNotification(event: NotificationEvent) {
    await this.prisma.notificationEventOutbox.create({
      data: {
        userId: event.userId,
        type: event.type,
        payload: JSON.stringify(event),
      },
    });
  }
}
