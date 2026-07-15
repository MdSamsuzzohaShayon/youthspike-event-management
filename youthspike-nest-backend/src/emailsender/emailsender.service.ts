// ─────────────────────────────────────────────────────────────
// emailsender.service.ts
// Updated to support dynamic template rendering from DB templates.
// Replaces both:
//   - Semantic nodes: <span data-placeholder="key">
//   - Legacy text:    {{key}}
// ─────────────────────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import { InjectModel } from '@nestjs/mongoose';
import { Emailcontent, Emailsender } from './emailsernder.schema';
import { Model, QueryFilter, UpdateQuery } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────

/** All known placeholder keys that can appear in templates */
export interface ITemplateValues {
  player_username?: string;
  coach_password?: string;
  ldo_name?: string;
  ldo_director_name?: string;
  ldo_email?: string;
  ldo_phone?: string;
  captain?: string;
  event_name?: string;
  event_date?: string;
  roster_lock_date?: string;
  frontend_url?: string;
  admin_client_url?: string;
  fwango_url?: string;
  american_spikers_url?: string;
  // Allow arbitrary extra keys for forward-compatibility
  [key: string]: string | undefined;
}

interface ISendTemplateEmail {
  to: string[];
  subject: string;
  /** Compiled email-safe HTML from the Template DB document (body field) */
  templateHtml: string;
  values: ITemplateValues;
}

interface ISendRawFileEmail {
  to: string[];
  subject: string;
  htmlFileName: string;
  values: ITemplateValues;
}

interface ITemplateInfoParams {
  to: string[];
  subject: string;
  htmlFileName: string;
  info: Record<string, any>;
}

// ── Service ───────────────────────────────────────────────────

@Injectable()
export class EmailsenderService {
  private transporter: nodemailer.Transporter;

  constructor(@InjectModel(Emailsender.name) private emailsenderModel: Model<Emailsender>, @InjectModel(Emailcontent.name) private emailcontentModel: Model<Emailcontent>, private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  // ── Core renderer ─────────────────────────────────────────

  /**
   * Render a compiled template HTML string by replacing all placeholders.
   *
   * Handles two formats produced by the frontend:
   *
   * 1. Semantic node (new):
   *    <span data-placeholder="captain" ...>{{captain}}</span>
   *    → replaced by the plain-text value
   *
   * 2. Legacy text pattern:
   *    {{captain}}
   *    → replaced by the plain-text value
   *
   * Missing values are left as-is ({{key}}) rather than throwing,
   * so a partially-configured template still sends.
   */
  renderTemplate(html: string, values: ITemplateValues): string {
    let result = html;

    // ── 1. Replace semantic placeholder nodes via DOM ──────
    try {
      const dom = new JSDOM(result);
      const document = dom.window.document;

      document.querySelectorAll('[data-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-placeholder') ?? '';
        const value = values[key];

        if (value !== undefined) {
          // Replace the entire <span> with a plain text node
          const text = document.createTextNode(this.escapeHtml(value));
          el.replaceWith(text);
        } else {
          // Leave visible but unstyled — strip the chip styling
          (el).textContent = `{{${key}}}`;
          (el).removeAttribute('style');
          (el).removeAttribute('class');
        }
      });

      result = dom.serialize();
    } catch (err) {
      // JSDOM not available or parse error — fall through to regex
      console.warn('[EmailsenderService] JSDOM rendering failed, using regex fallback:', err);
    }

    // ── 2. Replace any remaining {{key}} patterns ──────────
    result = result.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (_match, key) => {
      const value = values[key];
      return value !== undefined ? this.escapeHtml(value) : `{{${key}}}`;
    });

    return result;
  }

  // ── Send from DB template (primary path) ──────────────────

  /**
   * Send an email using a compiled template HTML string from the database.
   * This is the primary method used by sendCredentials.
   */
  async sendTemplateEmail({ to, subject, templateHtml, values }: ISendTemplateEmail): Promise<string> {
    try {
      const renderedHtml = this.renderTemplate(templateHtml, values);

      await this.transporter.sendMail({
        from: `${this.configService.get<string>('LEAGUE_NAME')} <${this.configService.get<string>('EMAIL_USER')}>`,
        to: to.join(', '),
        subject,
        html: renderedHtml,
      });

      console.log(`[EmailsenderService] Email sent to ${to.join(', ')}`);
      return renderedHtml;
    } catch (error) {
      console.error('[EmailsenderService] Error sending template email:', error);
      throw new Error('Failed to send template email');
    }
  }

  // ── Send from HTML file (legacy path) ─────────────────────

  /**
   * Legacy method: reads an HTML file from disk and replaces {{key}} tokens.
   * Kept for backward compatibility with the old send-credentials.html flow.
   */
  async sendHtmlEmail({ to, subject, htmlFileName, values }: ISendRawFileEmail): Promise<string> {
    try {
      const htmlFilePath = path.join(__dirname, '../../src/email/templates', htmlFileName);
      const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');
      const renderedHtml = this.renderTemplate(htmlContent, values);

      await this.transporter.sendMail({
        from: `${this.configService.get<string>('LEAGUE_NAME')} <${this.configService.get<string>('EMAIL_USER')}>`,
        to: to.join(', '),
        subject,
        html: renderedHtml,
      });

      console.log('[EmailsenderService] HTML file email sent successfully');
      return renderedHtml;
    } catch (error) {
      console.error('[EmailsenderService] Error sending HTML file email:', error);
      throw new Error('Failed to send HTML email');
    }
  }

  // ── Info email (unchanged) ────────────────────────────────

  async sendHtmlEmailInfo({ to, subject, htmlFileName, info }: ITemplateInfoParams): Promise<void> {
    try {
      const htmlFilePath = path.join(__dirname, '../../src/email/templates', htmlFileName);
      const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');
      const replacedHtmlContent = htmlContent.replace('{{informations}}', JSON.stringify(info));

      await this.transporter.sendMail({
        from: `${this.configService.get<string>('LEAGUE_NAME')} <${this.configService.get<string>('EMAIL_USER')}>`,
        to: to.join(', '),
        subject,
        html: replacedHtmlContent,
      });

      console.log('[EmailsenderService] Info email sent successfully');
    } catch (error) {
      console.error('[EmailsenderService] Error sending info email:', error);
      throw new Error('Failed to send HTML email');
    }
  }



  // ── Email sender ────────────────────────────────

  async findById(teamId: string): Promise<Emailsender | null> {
    return this.emailsenderModel.findById(teamId).lean();
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.emailsenderModel.findOne({ name });
  }

  async findOne(filter: QueryFilter<Emailsender>) {
    return this.emailsenderModel.findOne(filter).lean();
  }





  async find(filter: QueryFilter<Emailsender>, offset?: number, limit?: number) {
    let query = this.emailsenderModel.find(filter).sort({ name: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  async create(team: Emailsender) {

    return this.emailsenderModel.create(team);
  }

  async insertMany(teams: Emailsender[]) {
    return this.emailsenderModel.insertMany(teams);
  }


  async updateMany(filter: QueryFilter<Emailsender>, emailsender: UpdateQuery<Emailsender>) {
    return this.emailsenderModel.updateMany(filter, emailsender).lean();
  }
  async updateOne(filter: QueryFilter<Emailsender>, emailsender: UpdateQuery<Emailsender>) {
    const updateTeam = await this.emailsenderModel.updateOne(filter, emailsender);
    return updateTeam;
  }

  async delete(filter: QueryFilter<Emailsender>) {
    return this.emailsenderModel.deleteMany(filter);
  }

  async deleteOne(filter: QueryFilter<Emailsender>) {
    return this.emailsenderModel.deleteOne(filter);
  }

  async deleteMany(filter: QueryFilter<Emailsender>) {
    return this.emailsenderModel.deleteMany(filter);
  }

  async countDocuments() {
    return this.emailsenderModel.countDocuments();
  }




  // ── Email Content ────────────────────────────────

  async contentFindById(teamId: string): Promise<Emailcontent | null> {
    return this.emailcontentModel.findById(teamId).lean();
  }

  async contentFindByName(name: string) {
    if (!name) return null;
    return this.emailcontentModel.findOne({ name });
  }

  async contentFindOne(filter: QueryFilter<Emailcontent>) {
    return this.emailcontentModel.findOne(filter).lean();
  }





  async contentFind(filter: QueryFilter<Emailcontent>, offset?: number, limit?: number) {
    let query = this.emailcontentModel.find(filter).sort({ name: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  async contentCreate(team: Emailcontent) {

    return this.emailcontentModel.create(team);
  }

  async contentInsertMany(teams: Emailcontent[]) {
    return this.emailcontentModel.insertMany(teams);
  }


  async contentUpdateMany(filter: QueryFilter<Emailcontent>, emailsender: UpdateQuery<Emailcontent>) {
    return this.emailcontentModel.updateMany(filter, emailsender).lean();
  }
  async contentUpdateOne(filter: QueryFilter<Emailcontent>, emailsender: UpdateQuery<Emailcontent>) {
    const updateTeam = await this.emailcontentModel.updateOne(filter, emailsender);
    return updateTeam;
  }

  async contentDelete(filter: QueryFilter<Emailcontent>) {
    return this.emailcontentModel.deleteMany(filter);
  }

  async contentDeleteOne(filter: QueryFilter<Emailcontent>) {
    return this.emailcontentModel.deleteOne(filter);
  }

  async contentDeleteMany(filter: QueryFilter<Emailcontent>) {
    return this.emailcontentModel.deleteMany(filter);
  }

  async contentCountDocuments() {
    return this.emailcontentModel.countDocuments();
  }

  // ── Helpers ───────────────────────────────────────────────

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}