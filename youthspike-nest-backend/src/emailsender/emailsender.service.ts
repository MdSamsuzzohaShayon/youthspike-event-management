import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';

interface ITemplateGenerateParams {
  htmlFileName: string;
  player_username: string;
  coach_password: string;
  ldo_name: string;
  director_email: string;
  captain_name: string;
  event_date: string;
  eventId: string;
  ldoIdUrl: string;

  ldo_director_name: string;
  roster_lock_date: string;
  event_name: string;
  frontend_url: string;

  fwango_link?: string | null;
  ldo_phone?: string | null;
}

interface ITemplateParams extends ITemplateGenerateParams {
  to: string[];
  subject: string;
}

interface ITemplateInfoParams {
  to: string[];
  subject: string;
  htmlFileName: string;
  info: Record<string, any>;
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

  // Helper functions
  async generateHtml({
    htmlFileName,
    player_username,
    coach_password,
    ldo_name,
    director_email,
    captain_name,

    ldo_director_name,
    roster_lock_date,
    event_name,
    frontend_url,

    event_date,
    fwango_link,
    ldo_phone,
    eventId,
    ldoIdUrl,
  }: ITemplateGenerateParams): Promise<string> {
    const htmlFilePath = path.join(__dirname, '../../src/email/templates', htmlFileName);
    const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');

    const ADMIN_CLIENT_URL = this.configService.get<string>('ADMIN_CLIENT_URL');
    const FWANGO_URL = fwango_link || this.configService.get<string>('FWANGO_URL');
    const AMERICAN_SPIKERS_URL = this.configService.get<string>('AMERICAN_SPIKERS_URL');

    // eslint-disable-next-line prefer-const, @typescript-eslint/no-inferrable-types
    let organized_ldo_phone: string = '';
    if (ldo_phone) {
      organized_ldo_phone = `Phone: ${ldo_phone}`;
    }

    const clientUrl = `${ADMIN_CLIENT_URL}/${eventId}/matches/${ldoIdUrl}`;

    // Replace placeholders with actual values
    const replacements = {
      '{{admin_client_url}}': ADMIN_CLIENT_URL,
      '{{player_username}}': player_username,
      '{{player_password}}': coach_password,
      '{{ldo_name}}': ldo_name,
      '{{ldo_director_name}}': ldo_director_name,
      '{{roster_lock_date}}': roster_lock_date,
      '{{event_name}}': event_name,
      '{{frontend_url}}': frontend_url,
      '{{ldo_email}}': director_email,
      '{{ldo_phone}}': organized_ldo_phone,
      '{{event_date}}': event_date,
      '{{fwango_url}}': FWANGO_URL,
      '{{american_spikers_url}}': AMERICAN_SPIKERS_URL,
      '{{captain}}': captain_name,
    };
    
    let replacedHtmlContent = htmlContent;
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      // Use global regex to replace all occurrences of the placeholder
      const regex = new RegExp(placeholder, 'g');
      replacedHtmlContent = replacedHtmlContent.replace(regex, value);
    }
    

    return replacedHtmlContent;
  }

  async sendHtmlEmail({
    to,
    subject,
    htmlFileName,
    player_username,
    coach_password,
    ldo_name,

    ldo_director_name,
    roster_lock_date,
    event_name,
    frontend_url,

    director_email,
    captain_name,
    event_date,
    fwango_link,
    ldo_phone,
    eventId,
    ldoIdUrl,
  }: ITemplateParams) {
    try {
      const htmlContent = await this.generateHtml({
        htmlFileName,
        player_username,
        coach_password,
        ldo_name,
        director_email,
        captain_name,
        event_date,

        ldo_director_name,
        roster_lock_date,
        event_name,
        frontend_url,

        fwango_link,
        ldo_phone,
        eventId,
        ldoIdUrl,
      });

      await this.transporter.sendMail({
        from: `'American Spikers League <${this.configService.get<string>('EMAIL_USER')}>'`,
        to: to.join(', '),
        subject,
        html: htmlContent,
      });

      console.log('HTML Email sent successfully');
    } catch (error) {
      console.error('Error sending HTML email:', error);
      throw new Error('Failed to send HTML email');
    }
  }

  async sendHtmlEmailInfo({ to, subject, htmlFileName, info }: ITemplateInfoParams) {
    try {
      const htmlFilePath = path.join(__dirname, '../../src/email/templates', htmlFileName);
      const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');

      // Replace placeholders with actual values
      const replacedHtmlContent = htmlContent.replace('{{informations}}', JSON.stringify(info));

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
