import { Injectable } from '@nestjs/common';
import { ResendEmailProvider } from './resend.provider';

@Injectable()
export class EmailService {
  constructor(private readonly resendProvider: ResendEmailProvider) {}

  async sendEmail(input: {
    to: string[];
    subject: string;
    // text?: string;
    html: string;
  }) {
    return this.resendProvider.send(input);
  }
}
