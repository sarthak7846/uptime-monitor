import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationEventOutbox } from '@prisma/client';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationEvent } from 'src/shared/events/notification-event.types';

@Injectable()
export class EmailNotificationWorker {
  private readonly logger = new Logger(EmailNotificationWorker.name, {
    timestamp: true,
  });
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  //   handleCron() {
  //     this.logger.log('Running every second');
  //   }

  @Cron('*/10 * * * * *')
  async process() {
    this.logger.log('Finding pending notification events in outbox');
    const events = await this.prisma.notificationEventOutbox.findMany({
      where: { status: 'PENDING' },
      take: 10,
    });
    this.logger.log('Pending notification events in outbox', events);

    for (const event of events) {
      await this.handleEvent(event);
    }
  }

  private async handleEvent(event: NotificationEventOutbox) {
    const payload = event.payload as unknown as NotificationEvent;

    const rules = await this.prisma.notificationRule.findMany({
      where: {
        userId: payload.userId,
        enabled: true,
        events: { has: payload.type },
        OR: [{ monitorId: payload.monitorId }, { monitorId: null }],
        endpoint: { channel: 'EMAIL' },
      },
      include: {
        endpoint: true,
      },
    });

    for (const rule of rules) {
      // Send email
      console.log('rule', rule);

      const res = this.emailService.sendEmail({
        to: ['sarthakbehera09@gmail.com'],
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
        subject: 'Uptime Monitor Notification',
      });

      console.log('res', res);
    }

    //Update outbox state
    await this.prisma.notificationEventOutbox.update({
      where: { id: event.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    this.logger.log('Updated outbox state to PROCESSED');
  }
}
