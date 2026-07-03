// ─────────────────────────────────────────────────────────────
// useTemplateForm.ts
// All state + business logic for the template editor lives here.
// NewTemplatePage and EditTemplatePage each supply an `onSave` handler
// (create mutation vs. update mutation) and everything else is shared.
// ─────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

import { DEFAULT_BODY, DEFAULT_NAME, DEFAULT_SUBJECT, DEFINED_PLACEHOLDERS, SAMPLE_USERS } from '@/utils/defaultTemplateData';
import { ETemplateType, ITemplateCreate, TemplateVersion } from '@/types';
import { buildTemplateSavePayload, compileEmailHtml, extractUsedPlaceholderKeys, filterValidPlaceholders, SampleUser, validateTemplatePlaceholders } from '@/utils/templateFormUtils';
import { useTemplateVersions } from './useTemplateVersions';

export type TemplateFormTab = 'editor' | 'preview';
export type TemplateFormSidebar = 'placeholders' | 'versions';

export interface TemplateFormInitialValues {
  name?: string;
  subject?: string;
  body?: string;
  type?: ETemplateType;
  default?: boolean;
}

export interface TemplateSaveResult {
  success: boolean;
  message?: string;
}

/** Signature every consumer (create/edit page) implements to persist a template. */
export type TemplateSaveHandler = (payload: ITemplateCreate) => Promise<TemplateSaveResult>;

interface UseTemplateFormArgs {
  /** The event this template belongs to. Required — save is blocked without it. */
  eventId: string;
  /** Pre-fill values for editing an existing template. Omit for "create new". */
  initialValues?: TemplateFormInitialValues;
  /** Called with the compiled payload when the user saves. */
  onSave: TemplateSaveHandler;
}

export function useTemplateForm({ eventId, initialValues, onSave }: UseTemplateFormArgs) {
  const editorRef = useRef<Editor | null>(null);

  const [name, setName] = useState(initialValues?.name ?? DEFAULT_NAME);
  const [subject, setSubject] = useState(initialValues?.subject ?? DEFAULT_SUBJECT);
  const [body, setBody] = useState(initialValues?.body ?? DEFAULT_BODY);
  const [tab, setTab] = useState<TemplateFormTab>('editor');
  const [sidebar, setSidebar] = useState<TemplateFormSidebar>('placeholders');
  const [selectedUser, setSelectedUser] = useState<SampleUser>(SAMPLE_USERS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preserved on save but not editable in the UI today — carried through so
  // editing a "default" or non-TEAM template doesn't silently reset it.
  const [templateType] = useState<ETemplateType>(initialValues?.type ?? ETemplateType.TEAM);
  const [isDefaultTemplate] = useState<boolean>(initialValues?.default ?? false);

  const { versions, restoreVersion } = useTemplateVersions();

  const usedPlaceholderKeys = useMemo(() => extractUsedPlaceholderKeys(subject, body), [subject, body]);

  const validPlaceholders = useMemo(() => filterValidPlaceholders(usedPlaceholderKeys), [usedPlaceholderKeys]);

  const validation = useMemo(
    () => validateTemplatePlaceholders(subject, body, selectedUser),
    [subject, body, selectedUser],
  );

  const compiledEmailHtml = useMemo(() => compileEmailHtml(body, subject), [body, subject]);

  const handleEditorReady = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  const handleRestore = useCallback(
    (version: TemplateVersion) => {
      const restored = restoreVersion(version);
      setSubject(restored.subject);
      setBody(restored.body);
      setSidebar('placeholders');
    },
    [restoreVersion],
  );

  const handleSave = useCallback(async () => {
    if (!eventId) {
      setSaveError('Missing event reference — cannot save template.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = buildTemplateSavePayload({
        name,
        subject,
        body,
        eventId,
        templateType,
        isDefault: isDefaultTemplate,
      });
      const result = await onSave(payload);
      if (!result.success) {
        setSaveError(result.message ?? 'Failed to save template.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while saving template.';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [eventId, name, subject, body, templateType, isDefaultTemplate, onSave]);

  return {
    // field state
    name,
    setName,
    subject,
    setSubject,
    body,
    setBody,
    tab,
    setTab,
    sidebar,
    setSidebar,
    selectedUser,
    setSelectedUser,

    // derived values
    usedPlaceholderKeys,
    validPlaceholders,
    validation,
    compiledEmailHtml,

    // version history
    versions,
    handleRestore,

    // save lifecycle
    isSaving,
    saveError,
    handleSave,

    // rich-text editor handle
    editorRef,
    handleEditorReady,

    // static reference data
    definedPlaceholders: DEFINED_PLACEHOLDERS,
    sampleUsers: SAMPLE_USERS,
  };
}

export type TemplateFormState = ReturnType<typeof useTemplateForm>;