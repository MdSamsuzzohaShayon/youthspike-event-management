// ─────────────────────────────────────────────────────────────
// utils/template.ts – placeholder helpers & sanitization
// ─────────────────────────────────────────────────────────────

import DOMPurify from 'isomorphic-dompurify';
import { IPlaceholderValidationResult, ISampleUser } from '@/types';

const PLACEHOLDER_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/** Extract all unique placeholder keys from an HTML string */
export function extractPlaceholders(html: string): string[] {
  const matches = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_REGEX.source, 'g');
  while ((m = re.exec(html)) !== null) {
    matches.add(m[1]);
  }
  return Array.from(matches);
}

/** Sanitize dynamic HTML to prevent XSS */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p','br','strong','em','u','s','a','ul','ol','li',
      'h1','h2','h3','h4','blockquote','hr','span','div',
      'table','thead','tbody','tr','th','td','img',
    ],
    ALLOWED_ATTR: ['href','target','rel','class','style','src','alt'],
    ALLOW_DATA_ATTR: false,
  });
}

/** Replace {{key}} tokens with values from the provided map */
export function replacePlaceholders(
  html: string,
  values: Record<string, string>,
  sanitize = true,
): string {
  const replaced = html.replace(PLACEHOLDER_REGEX, (_, key) => {
    const val = values[key];
    if (val === undefined) return `<mark style="background:#fef08a;padding:0 2px">{{${key}}}</mark>`;
    return sanitize ? DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }) : val;
  });
  return replaced;
}

/** Validate that all placeholders in the body have sample values */
export function validatePlaceholders(
  body: string,
  sampleUser: ISampleUser,
  definedKeys: string[],
): IPlaceholderValidationResult {
  const usedInBody = extractPlaceholders(body);
  const missing = usedInBody.filter((k) => !(k in sampleUser.values));
  const unused = definedKeys.filter((k) => !usedInBody.includes(k));
  return { valid: missing.length === 0, missing, unused };
}

/** Generate a simple version label */
export function generateVersionLabel(index: number): string {
  return `v${index + 1} – ${new Date().toLocaleString()}`;
}