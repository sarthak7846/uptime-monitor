import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ResendEmailProvider } from './resend.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, ResendEmailProvider],
  exports: [EmailService],
})
export class EmailModule {}
