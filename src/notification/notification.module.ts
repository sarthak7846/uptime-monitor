import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailNotificationWorker } from './email-notification.worker';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [EmailModule],
  providers: [NotificationService, EmailNotificationWorker],
  exports: [NotificationService],
})
export class NotificationModule {}
