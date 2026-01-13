import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationEvent } from 'src/shared/events/notification-event.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name, {
    timestamp: true,
  });

  constructor(private readonly prisma: PrismaService) {}
  async emitNotification(event: NotificationEvent) {
    await this.prisma.notificationEventOutbox.create({
      data: {
        userId: event.userId,
        type: event.type,
        payload: JSON.stringify(event),
      },
    });
    this.logger.log('Emitted notification');
  }
}
