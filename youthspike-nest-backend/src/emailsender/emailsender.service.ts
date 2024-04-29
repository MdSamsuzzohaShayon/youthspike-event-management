import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailsenderService {
  private transporter;
  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendHtmlEmail(to: string, subject: string, htmlFileName: string) {
    try {
        const htmlFilePath = path.join(__dirname, '../../src/email/templates', htmlFileName);
      const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');

      // Replace placeholders with actual values
      const replacedHtmlContent = htmlContent
        .replace('{{captain}}', 'r_captain')
        .replace('{{co_captain}}', 'r_coCaptain');

      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to,
        subject,
        html: replacedHtmlContent,
      });

      console.log('HTML Email sent successfully');
    } catch (error) {
      console.error('Error sending HTML email:', error);
      throw new Error('Failed to send HTML email');
    }
  }
}
