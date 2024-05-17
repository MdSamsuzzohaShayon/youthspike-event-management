import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

interface ITemplateParams {
  to: string[];
  subject: string;
  htmlFileName: string;
  player_username: string;
  coach_password: string;
  ldo_name: string;
  director_email: string;
  captain_name: string;
  event_date: string;
  fwango_link?: string | null;
  ldo_phone?:string | null;
}

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

  async sendHtmlEmail({
    to,
    subject,
    htmlFileName,
    player_username,
    coach_password,
    ldo_name,
    director_email,
    captain_name,
    event_date,
    fwango_link,
    ldo_phone
  }: ITemplateParams) {
    try {
      const htmlFilePath = path.join(__dirname, '../../src/email/templates', htmlFileName);
      const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');

      const ADMIN_CLIENT_URL = this.configService.get<string>('ADMIN_CLIENT_URL');
      const FWANGO_URL = fwango_link || this.configService.get<string>('FWANGO_URL');
      const AMERICAN_SPIKERS_URL = this.configService.get<string>('AMERICAN_SPIKERS_URL');

      // eslint-disable-next-line prefer-const, @typescript-eslint/no-inferrable-types
      let organized_ldo_phone: string = '';
      if(ldo_phone){
        organized_ldo_phone = `Phone: ${ldo_phone}`;
      }

      // Replace placeholders with actual values
      const replacedHtmlContent = htmlContent
        .replace('{{admin_client_url}}', ADMIN_CLIENT_URL)
        .replace('{{player_username}}', player_username)
        .replace('{{player_password}}', coach_password)
        .replace('{{ldo_name}}', ldo_name)

        .replace('{{ldo_email}}', director_email)
        .replace('{{ldo_phone}}', organized_ldo_phone)
        .replace('{{event_date}}', event_date)
        .replace('{{fwango_url}}', FWANGO_URL)
        .replace('{{american_spikers_url}}', AMERICAN_SPIKERS_URL)
        .replace('{{captain}}', captain_name);

      await this.transporter.sendMail({
        from: `'American Spikers League <${this.configService.get<string>('EMAIL_USER')}>'`,
        to: to.join(', '),
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
