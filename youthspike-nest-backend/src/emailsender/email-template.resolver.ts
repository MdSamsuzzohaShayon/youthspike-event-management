// ─────────────────────────────────────────────────────────────
// backend/email-template.resolver.ts  (NestJS + GraphQL)
// ─────────────────────────────────────────────────────────────
//
// Installation:
//   npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express
//               isomorphic-dompurify class-validator class-transformer
//
// ─────────────────────────────────────────────────────────────

import {
    Args,
    Field,
    ID,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
  } from '@nestjs/graphql';
  import * as DOMPurify from 'isomorphic-dompurify';
  
  // ── Types ─────────────────────────────────────────────────────
  
  @ObjectType()
  class PlaceholderInfo {
    @Field()        key: string;
    @Field()        label: string;
    @Field()        sampleValue: string;
  }
  
  @ObjectType()
  class TemplateMetadataGql {
    @Field(() => ID)  id: string;
    @Field()          name: string;
    @Field(() => [PlaceholderInfo])
    placeholders: PlaceholderInfo[];
    @Field()          createdAt: string;
    @Field()          updatedAt: string;
  }
  
  @ObjectType()
  class EmailTemplate {
    @Field(() => ID)  id: string;
    @Field()          subject: string;
    @Field()          body: string;       // sanitized HTML
    @Field(() => TemplateMetadataGql)
    metadata: TemplateMetadataGql;
  }
  
  @ObjectType()
  class EmailTemplateVersion {
    @Field(() => ID) versionId: string;
    @Field(() => ID) templateId: string;
    @Field()         subject: string;
    @Field()         body: string;
    @Field()         savedAt: string;
    @Field()         label: string;
  }
  
  @ObjectType()
  class SendEmailResult {
    @Field() success: boolean;
    @Field({ nullable: true }) error?: string;
  }
  
  @ObjectType()
  class ValidationResult {
    @Field() valid: boolean;
    @Field(() => [String]) missing: string[];
    @Field(() => [String]) unused: string[];
  }
  
  // ── Inputs ────────────────────────────────────────────────────
  
  @InputType()
  class SaveTemplateInput {
    @Field()          subject: string;
    @Field()          body: string;       // HTML from TipTap
    @Field()          templateName: string;
    @Field(() => [String])
    placeholderKeys: string[];
  }
  
  @InputType()
  class SendEmailInput {
    @Field(() => ID)  templateId: string;
    @Field()          recipientEmail: string;
    @Field()          recipientName: string;
    /** JSON stringified map of placeholder → value */
    @Field()          valuesJson: string;
  }
  
  // ── Helpers ───────────────────────────────────────────────────
  
  const PLACEHOLDER_RE = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  
  function extractKeys(text: string): string[] {
    const found = new Set<string>();
    let m: RegExpExecArray | null;
    const re = new RegExp(PLACEHOLDER_RE.source, 'g');
    while ((m = re.exec(text)) !== null) found.add(m[1]);
    return Array.from(found);
  }
  
  function sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p','br','strong','em','u','s','a','ul','ol','li',
        'h1','h2','h3','h4','blockquote','hr','span','div',
        'table','thead','tbody','tr','th','td',
      ],
      ALLOWED_ATTR: ['href','target','rel','class','style'],
      ALLOW_DATA_ATTR: false,
    });
  }
  
  function replacePlaceholders(html: string, values: Record<string, string>): string {
    return html.replace(PLACEHOLDER_RE, (_, key) => {
      const val = values[key];
      if (!val) return `{{${key}}}`;
      // sanitize each value individually to prevent injection
      return DOMPurify.sanitize(val, { ALLOWED_TAGS: [] });
    });
  }
  
  // ── In-memory stores (replace with DB in production) ──────────
  
  const templates = new Map<string, EmailTemplate>();
  const versionStore = new Map<string, EmailTemplateVersion[]>();
  
  // ── Resolver ──────────────────────────────────────────────────
  
  @Resolver()
  export class EmailTemplateResolver {
  
    // ── Queries ─────────────────────────────────────────────────
  
    @Query(() => [EmailTemplate])
    async listTemplates(): Promise<EmailTemplate[]> {
      return Array.from(templates.values());
    }
  
    @Query(() => EmailTemplate, { nullable: true })
    async getTemplate(
      @Args('id', { type: () => ID }) id: string,
    ): Promise<EmailTemplate | undefined> {
      return templates.get(id);
    }
  
    @Query(() => [EmailTemplateVersion])
    async listVersions(
      @Args('templateId', { type: () => ID }) templateId: string,
    ): Promise<EmailTemplateVersion[]> {
      return versionStore.get(templateId) ?? [];
    }
  
    @Query(() => ValidationResult)
    async validateTemplate(
      @Args('subject') subject: string,
      @Args('body')    body: string,
      @Args('definedKeys', { type: () => [String] }) definedKeys: string[],
      @Args('sampleValuesJson') sampleValuesJson: string,
    ): Promise<ValidationResult> {
      const sampleValues: Record<string, string> = JSON.parse(sampleValuesJson);
      const usedInBody = extractKeys(body + subject);
      const missing = usedInBody.filter((k) => !(k in sampleValues));
      const unused  = definedKeys.filter((k) => !usedInBody.includes(k));
      return { valid: missing.length === 0, missing, unused };
    }
  
    // ── Mutations ───────────────────────────────────────────────
  
    @Mutation(() => EmailTemplate)
    async saveTemplate(
      @Args('input') input: SaveTemplateInput,
    ): Promise<EmailTemplate> {
      const id = `tmpl_${Date.now()}`;
      const sanitizedBody    = sanitize(input.body);
      const sanitizedSubject = DOMPurify.sanitize(input.subject, { ALLOWED_TAGS: [] });
  
      // Validate: all used placeholders must be in the declared list
      const usedKeys = extractKeys(sanitizedBody + sanitizedSubject);
      const undeclared = usedKeys.filter((k) => !input.placeholderKeys.includes(k));
      if (undeclared.length) {
        throw new Error(`Undeclared placeholders found: ${undeclared.join(', ')}`);
      }
  
      const template: EmailTemplate = {
        id,
        subject: sanitizedSubject,
        body: sanitizedBody,
        metadata: {
          id,
          name: DOMPurify.sanitize(input.templateName, { ALLOWED_TAGS: [] }),
          placeholders: input.placeholderKeys.map((k) => ({
            key: k, label: k.replace(/_/g, ' '), sampleValue: '',
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      templates.set(id, template);
  
      // Save initial version
      const version: EmailTemplateVersion = {
        versionId:  `ver_${Date.now()}`,
        templateId: id,
        subject:    template.subject,
        body:       template.body,
        savedAt:    new Date().toISOString(),
        label:      'v1 – initial save',
      };
      versionStore.set(id, [version]);
  
      return template;
    }
  
    @Mutation(() => EmailTemplateVersion)
    async updateTemplate(
      @Args('id', { type: () => ID }) id: string,
      @Args('input') input: SaveTemplateInput,
    ): Promise<EmailTemplateVersion> {
      const existing = templates.get(id);
      if (!existing) throw new Error(`Template ${id} not found`);
  
      const sanitizedBody    = sanitize(input.body);
      const sanitizedSubject = DOMPurify.sanitize(input.subject, { ALLOWED_TAGS: [] });
  
      // Validate placeholders
      const usedKeys = extractKeys(sanitizedBody + sanitizedSubject);
      const undeclared = usedKeys.filter((k) => !input.placeholderKeys.includes(k));
      if (undeclared.length) {
        throw new Error(`Undeclared placeholders found: ${undeclared.join(', ')}`);
      }
  
      existing.subject         = sanitizedSubject;
      existing.body            = sanitizedBody;
      existing.metadata.updatedAt = new Date().toISOString();
      templates.set(id, existing);
  
      const prevVersions = versionStore.get(id) ?? [];
      const newVersion: EmailTemplateVersion = {
        versionId:  `ver_${Date.now()}`,
        templateId: id,
        subject:    sanitizedSubject,
        body:       sanitizedBody,
        savedAt:    new Date().toISOString(),
        label:      `v${prevVersions.length + 1} – ${new Date().toLocaleString()}`,
      };
      versionStore.set(id, [newVersion, ...prevVersions].slice(0, 20));
  
      return newVersion;
    }
  
    @Mutation(() => SendEmailResult)
    async sendTemplateEmail(
      @Args('input') input: SendEmailInput,
    ): Promise<SendEmailResult> {
      try {
        const template = templates.get(input.templateId);
        if (!template) throw new Error('Template not found');
  
        // Parse & sanitize replacement values
        const rawValues: Record<string, string> = JSON.parse(input.valuesJson);
        const safeValues: Record<string, string> = {};
        for (const [k, v] of Object.entries(rawValues)) {
          safeValues[k] = DOMPurify.sanitize(String(v), { ALLOWED_TAGS: [] });
        }
  
        // Validate all placeholders in template have values
        const usedKeys = extractKeys(template.body + template.subject);
        const missing  = usedKeys.filter((k) => !(k in safeValues));
        if (missing.length) {
          throw new Error(`Missing values for: ${missing.join(', ')}`);
        }
  
        const finalBody    = replacePlaceholders(template.body,    safeValues);
        const finalSubject = replacePlaceholders(template.subject, safeValues);
  
        // ── Integrate your email provider here ────────────────────
        // e.g. SendGrid, AWS SES, Nodemailer …
        // await emailService.send({
        //   to: input.recipientEmail,
        //   subject: finalSubject,
        //   html: finalBody,
        // });
        console.log('[EmailTemplateResolver] Would send email:', {
          to: input.recipientEmail,
          subject: finalSubject,
          bodyLength: finalBody.length,
        });
  
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  }