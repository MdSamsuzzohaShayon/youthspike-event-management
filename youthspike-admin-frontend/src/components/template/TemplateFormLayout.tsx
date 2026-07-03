// ─────────────────────────────────────────────────────────────
// TemplateFormLayout.tsx
// Purely presentational. All state/business logic comes from
// `useTemplateForm` — this component only renders it.
// ─────────────────────────────────────────────────────────────
'use client';

import React from 'react';

import SampleUserSelector from '@/components/template/SampleUserSelector';
import RichEditor from '@/components/template/RichEditor';
import EmailPreview from '@/components/template/EmailPreview';
import PlaceholderPanel from '@/components/template/PlaceholderPanel';
import VersionHistory from '@/components/template/VersionHistory';
import InputField from '@/components/elements/forms/InputField';
import { TemplateFormState, TemplateFormTab } from '@/hooks/template/useTemplateForm';


const TAB_OPTIONS: TemplateFormTab[] = ['editor', 'preview'];
const TAB_LABELS: Record<TemplateFormTab, string> = {
  editor: '✏️ Editor',
  preview: '👁 Preview',
};

interface TemplateFormLayoutProps {
  title: string;
  description?: string;
  saveLabel?: string;
  form: TemplateFormState;
}

export default function TemplateFormLayout({
  title,
  description = 'Use the Placeholders panel to insert {{tokens}} as semantic nodes',
  saveLabel = 'Save Template',
  form,
}: TemplateFormLayoutProps) {
  const {
    name,
    setName,
    subject,
    setSubject,
    body,
    setBody,
    tab,
    setTab,
    sidebar,
    selectedUser,
    setSelectedUser,
    usedPlaceholderKeys,
    validation,
    compiledEmailHtml,
    versions,
    handleRestore,
    isSaving,
    saveError,
    handleSave,
    handleEditorReady,
    definedPlaceholders,
    sampleUsers,
    editorRef,
  } = form;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <TemplateFormHeader
        title={title}
        description={description}
        saveLabel={saveLabel}
        missingCount={validation.missing.length}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {saveError && (
        <p role="alert" className="max-w-screen-2xl mx-auto mt-2 text-sm text-red-600">
          {saveError}
        </p>
      )}

      <main className="max-w-screen-2xl">
        <div className="flex flex-col lg:flex-row gap-5 mt-4">
          {/* ── Left: Editor or Preview ── */}
          <section className="flex-1 min-w-0 w-full flex flex-col gap-4">
            <InputField name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <InputField name="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />

            {tab === 'preview' && (
              <SampleUserSelector users={sampleUsers} selected={selectedUser} onChange={setSelectedUser} />
            )}

            {tab === 'editor' ? (
              <RichEditor
                content={body}
                onChange={setBody}
                // onEditorReady={handleEditorReady}
                missingPlaceholderKeys={validation.missing}
              />
            ) : (
              // Preview the actual email-safe compiled HTML, not the raw editor markup.
              <EmailPreview html={compiledEmailHtml} subject={subject} sampleUser={selectedUser} />
            )}
          </section>

          {/* ── Right sidebar ── */}
          <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
            <TabToggle value={tab} options={TAB_OPTIONS} labels={TAB_LABELS} onChange={setTab} />

            {sidebar === 'placeholders' && (
              <PlaceholderPanel
                editor={editorRef.current}
                placeholders={definedPlaceholders}
                usedKeys={usedPlaceholderKeys}
                missingKeys={validation.missing}
              />
            )}

            {sidebar === 'versions' && (
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Version History</h3>
                <VersionHistory versions={versions} onRestore={handleRestore} />
              </div>
            )}

            <TemplateJsonPreview
              name={name}
              subject={subject}
              usedPlaceholderKeys={usedPlaceholderKeys}
              body={body}
              compiledEmailHtml={compiledEmailHtml}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

// ── Subcomponents ───────────────────────────────────────────────
// Each owns exactly one piece of the layout (SRP), which also makes the
// parent component's JSX easy to scan.

interface TemplateFormHeaderProps {
  title: string;
  description: string;
  saveLabel: string;
  missingCount: number;
  isSaving: boolean;
  onSave: () => void;
}

function TemplateFormHeader({ title, description, saveLabel, missingCount, isSaving, onSave }: TemplateFormHeaderProps) {
  return (
    <header className="py-4 shadow-sm border-b border-yellow-500/50">
      <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>

        <div className="flex flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {missingCount > 0 ? (
            <span className="btn-danger">
              ⚠ {missingCount} missing value{missingCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="btn-success">✓ All placeholders resolved</span>
          )}

          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn-info disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

interface TabToggleProps<T extends string> {
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}

function TabToggle<T extends string>({ value, options, labels, onChange }: TabToggleProps<T>) {
  return (
    <div className="inline-flex rounded-lg p-1 gap-1 shadow-sm w-full">
      {options.map((option) => (
        <button key={option} onClick={() => onChange(option)} className={value === option ? 'btn-info' : 'btn-secondary'}>
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

interface TemplateJsonPreviewProps {
  name: string;
  subject: string;
  usedPlaceholderKeys: string[];
  body: string;
  compiledEmailHtml: string;
}

function TemplateJsonPreview({ name, subject, usedPlaceholderKeys, body, compiledEmailHtml }: TemplateJsonPreviewProps) {
  const preview = {
    name,
    subject,
    placeholders: usedPlaceholderKeys,
    bodyPreview: `${body.slice(0, 80)}…`,
    compiledPreview: `${compiledEmailHtml.slice(0, 80)}…`,
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg overflow-hidden">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stored JSON</h3>
      <pre className="text-[10px] rounded p-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all text-gray-300">
        {JSON.stringify(preview, null, 2)}
      </pre>
    </div>
  );
}