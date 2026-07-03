// ─────────────────────────────────────────────────────────────
// templateFormUtils.ts
// Pure, side-effect-free helpers shared by the template create/edit flows.
// Keeping these outside the hook makes them trivially unit-testable.
// ─────────────────────────────────────────────────────────────

import { DEFINED_PLACEHOLDERS, SAMPLE_USERS } from '@/utils/defaultTemplateData';
import { extractPlaceholders, validatePlaceholders } from '@/utils/templates';
import { transformToEmailHtml, wrapEmailShell } from '@/utils/emailTransformer';
import { ETemplateType, ITemplateCreate, TPlaceholder } from '@/types';

export type SampleUser = (typeof SAMPLE_USERS)[number];

/** The full set of placeholder keys the template editor recognizes. */
const SUPPORTED_PLACEHOLDER_KEYS = new Set<TPlaceholder>([
  'tournamentName',
  'playerName',
  'startDate',
  'teamName',
  'matchTime',
  'courtNumber',
]);

/**
 * Narrows a list of raw placeholder strings down to the subset that are
 * recognized `TPlaceholder` keys. Anything the editor doesn't know about
 * (typos, stray `{{...}}`, etc.) is dropped rather than sent to the API.
 */
export function filterValidPlaceholders(usedKeys: string[]): TPlaceholder[] {
  return usedKeys.filter((key): key is TPlaceholder => SUPPORTED_PLACEHOLDER_KEYS.has(key as TPlaceholder));
}

/** Extracts every `{{placeholder}}` token referenced across the subject and body. */
export function extractUsedPlaceholderKeys(subject: string, body: string): string[] {
  return extractPlaceholders(body + subject);
}

/** Runs placeholder validation against the currently selected sample user. */
export function validateTemplatePlaceholders(subject: string, body: string, sampleUser: SampleUser) {
  return validatePlaceholders(
    body + subject,
    sampleUser,
    DEFINED_PLACEHOLDERS.map((p) => p.key),
  );
}

/** Converts raw TipTap HTML into the email-safe, fully wrapped HTML used for storage/preview. */
export function compileEmailHtml(body: string, subject: string): string {
  const transformed = transformToEmailHtml(body);
  return wrapEmailShell(transformed, subject);
}

export interface BuildTemplatePayloadArgs {
  name: string;
  subject: string;
  body: string;
  eventId: string;
  templateType?: ETemplateType;
  isDefault?: boolean;
}

/**
 * Pure builder for the payload sent to the create/update template mutation.
 * Centralizing this avoids the create and edit pages drifting apart on how
 * a template gets serialized.
 */
export function buildTemplateSavePayload({
  name,
  subject,
  body,
  eventId,
  templateType = ETemplateType.TEAM,
  isDefault = false,
}: BuildTemplatePayloadArgs): ITemplateCreate {
  const compiledBody = compileEmailHtml(body, subject);
  const usedKeys = extractUsedPlaceholderKeys(subject, body);

  return {
    name,
    type: templateType,
    default: isDefault,
    subject,
    body: compiledBody,
    images: [],
    placeholders: filterValidPlaceholders(usedKeys),
    event: eventId,
  };
}