// ─────────────────────────────────────────────────────────────
// Email Template Editor – shared TypeScript types
// ─────────────────────────────────────────────────────────────

export interface ITemplatePlaceholder {
    key: string;          // e.g. "player_username"
    label: string;        // human-readable label
    description?: string;
    sampleValue: string;  // used for preview rendering
}

export interface ITemplateMetadata {
    id: string;
    name: string;
    description?: string;
    placeholders: ITemplatePlaceholder[];
    createdAt: string;
    updatedAt: string;
}

export interface TemplateVersion {
    versionId: string;
    templateId: string;
    subject: string;
    body: string;           // raw HTML from TipTap
    metadata: ITemplateMetadata;
    savedAt: string;
    label?: string;         // e.g. "v1 – initial"
}

export interface ITemplateStorage {
    subject: string;
    body: string;           // HTML
    metadata: ITemplateMetadata;
}

export interface ISampleUser {
    id: string;
    label: string;
    values: Record<string, string>;
}

export interface IPlaceholderValidationResult {
    valid: boolean;
    missing: string[];    // placeholders in body but no sample value
    unused: string[];     // defined but not used in body
}