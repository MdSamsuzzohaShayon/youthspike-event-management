// ─────────────────────────────────────────────────────────────
// utils/templates.ts – placeholder helpers & sanitization
// Updated to handle both:
//   - Legacy text-based {{key}} placeholders
//   - New PlaceholderNode: <span data-placeholder="key">{{key}}</span>
// ─────────────────────────────────────────────────────────────

import DOMPurify from 'isomorphic-dompurify';
import { IPlaceholderValidationResult, ISampleUser } from '@/types';

// ── Regex for legacy text {{key}} patterns ────────────────────
const PLACEHOLDER_TEXT_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/**
 * Extract all unique placeholder keys from an HTML string.
 * Handles both:
 *  1. Semantic nodes: <span data-placeholder="key">
 *  2. Legacy text: {{key}}
 */
export function extractPlaceholders(html: string): string[] {
  const matches = new Set<string>();

  // ── 1. Extract from data-placeholder attributes (browser-side) ──
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('[data-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-placeholder');
        if (key) matches.add(key);
      });
    } catch {
      // fallback to regex only
    }
  }

  // ── 2. Extract from legacy {{key}} text patterns ──────────────
  const re = new RegExp(PLACEHOLDER_TEXT_REGEX.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.add(m[1]);
  }

  return Array.from(matches);
}

/** Sanitize dynamic HTML to prevent XSS */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'blockquote', 'hr', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'data-placeholder', 'data-type'],
    ALLOW_DATA_ATTR: true,
  });
}

/**
 * Replace placeholder nodes and {{key}} tokens with values.
 *
 * Handles:
 *  1. <span data-placeholder="key"> nodes → replace innerHTML with value
 *  2. Legacy {{key}} text patterns → replace with value
 */
export function replacePlaceholders(
  html: string,
  values: Record<string, string>,
  sanitize = true,
): string {
  let result = html;

  // ── 1. Replace data-placeholder span nodes ────────────────────
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div id="__r">${html}</div>`, 'text/html');
      const root = doc.getElementById('__r')!;

      root.querySelectorAll('[data-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-placeholder') ?? '';
        const val = values[key];

        if (val !== undefined) {
          // Replace the whole span with the value (plain text, safe)
          const safe = sanitize ? escapeText(val) : val;
          const text = doc.createTextNode(safe);
          el.replaceWith(text);
        } else {
          // Missing — highlight it
          (el as HTMLElement).style.cssText =
            'background:#fef08a;color:#92400e;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.85em;';
          (el as HTMLElement).textContent = `{{${key}}}`;
        }
      });

      result = root.innerHTML;
    } catch {
      // SSR or parse failure — fall through to regex
    }
  }

  // ── 2. Replace any remaining legacy {{key}} text patterns ────
  result = result.replace(PLACEHOLDER_TEXT_REGEX, (_, key) => {
    const val = values[key];
    if (val === undefined) {
      return `<mark style="background:#fef08a;padding:0 2px;color:#92400e;border-radius:2px">{{${key}}}</mark>`;
    }
    return sanitize ? escapeText(val) : val;
  });

  return result;
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

/** Escape text for safe HTML insertion */
function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}