// ─────────────────────────────────────────────────────────────
// NewTemplatePage.tsx  (Next.js page component)
// ─────────────────────────────────────────────────────────────
'use client';

import React, { useCallback, useMemo, useState } from 'react';

import {
  DEFAULT_BODY,
  DEFAULT_SUBJECT,
  DEFINED_PLACEHOLDERS,
  SAMPLE_USERS,
} from '@/utils/defaultTemplateData';
import { extractPlaceholders, validatePlaceholders } from '@/utils/templates';
import { useTemplateVersions } from '@/hooks/useTemplateVersions';
import SampleUserSelector from '@/components/template/SampleUserSelector';
import RichEditor from '@/components/template/RichEditor';
import EmailPreview from '@/components/template/EmailPreview';
import PlaceholderPanel from '@/components/template/PlaceholderPanel';
import VersionHistory from '@/components/template/VersionHistory';
import { TemplateVersion } from '@/types';
import InputField from '@/components/elements/forms/InputField';

type Tab = 'editor' | 'preview';
type Sidebar = 'placeholders' | 'versions';

export default function NewTemplatePage() {
  // ── state ──────────────────────────────────────────────────
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [tab, setTab] = useState<Tab>('editor');
  const [sidebar, setSidebar] = useState<Sidebar>('placeholders');
  const [selectedUser, setSelectedUser] = useState(SAMPLE_USERS[0]);
  const [saveMsg, setSaveMsg] = useState('');

  const { versions, saveVersion, restoreVersion } = useTemplateVersions();

  // ── derived ─────────────────────────────────────────────────
  const usedKeys = useMemo(() => extractPlaceholders(body + subject), [body, subject]);

  const validation = useMemo(
    () =>
      validatePlaceholders(
        body + subject,
        selectedUser,
        DEFINED_PLACEHOLDERS.map((p) => p.key),
      ),
    [body, subject, selectedUser],
  );

  // ── actions ─────────────────────────────────────────────────
  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setSubject(inputEl.value);
  }
  const handleSave = useCallback(() => {
    // Format 
    /**
     {
  "input":{
    "name": "Welcome Tournament Email - 3",
    "type": "PLAYER",
    "subject": "Welcome to {{tournamentName}}, {{playerName}}!",
    "body": "<h1>Hello {{playerName}}!</h1><p>We're excited to have you join the {{tournamentName}} tournament starting on {{startDate}}.</p><p>Your team: {{teamName}}</p><p>First match: {{matchTime}} on Court {{courtNumber}}</p><p>See you there!</p><p>Best regards,<br/>The Tournament Team</p>",
    "images": [],
    "placeholders": [
      "tournamentName",
      "playerName", 
      "startDate",
      "teamName",
      "matchTime",
      "courtNumber"
    ],
    "event": "68afc5f30bf9dbb4ac0f69cb"
	}
}
     */
    saveVersion({
      templateId: 'new-template',
      subject,
      body,
      metadata: {
        id: 'new-template',
        name: 'Captain Credentials Email',
        placeholders: DEFINED_PLACEHOLDERS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // Optional: Save to backend
    // saveTemplateToBackend();


    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }, [saveVersion, subject, body]);

  const handleRestore = useCallback(
    (v: TemplateVersion) => {
      const restored = restoreVersion(v);
      setSubject(restored.subject);
      setBody(restored.body);
      setSidebarTab('placeholders');
      console.log(restored);

    },
    [restoreVersion],
  );

  // helper to keep sidebar name consistent
  const setSidebarTab = (s: Sidebar) => setSidebar(s);

  // ── render ──────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 min-h-screen overflow-x-hidden">
      {/* ── Header ── */}
      <header className=" py-4 shadow-sm border-b border-yellow-500/50">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Email Template Editor</h1>
            <p className="text-xs text-gray-500 mt-0.5">Use <code className="bg-gray-300 px-1 rounded font-mono">{'{{placeholder}}'}</code> tokens in the subject and body</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sample user selector */}
            <SampleUserSelector
              users={SAMPLE_USERS}
              selected={selectedUser}
              onChange={setSelectedUser}
            />

            {/* Validation badge */}
            {validation.missing.length > 0 ? (
              <button className="btn-danger">
                ⚠ {validation.missing.length} missing value{validation.missing.length > 1 ? 's' : ''}
              </button>
            ) : (
              <button className="btn-success">
                ✓ All placeholders resolved
              </button>
            )}

            <button
              onClick={handleSave}
              className="btn-info"
            >
              {saveMsg || 'Save Version'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="max-w-screen-2xl mt-4">
        <div className="inline-flex rounded-lg p-1 gap-1 shadow-sm">
          {(['editor', 'preview'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${tab === t
                ? 'btn-info'
                : 'btn-secondary'
                }`}
            >
              {t === 'editor' ? '✏️ Editor' : '👁 Preview'}
            </button>
          ))}

        </div>
      </div>

      {/* ── Main layout ── */}
      <main className="max-w-screen-2xl">
        <div className="flex gap-5 mt-4">

          {/* ── Left: Editor or Preview ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <InputField type='text' name='subject' handleInputChange={handleInputChange} />

            {tab === 'editor' ? (
              <RichEditor content={body} onChange={setBody} />
            ) : (
              <EmailPreview html={body} subject={subject} sampleUser={selectedUser} />
            )}
          </div>

          {/* ── Right sidebar ── */}
          <aside className="w-72 shrink-0 flex flex-col gap-4">
            {/* Sidebar tabs */}
            <div className=" rounded-lg flex shadow-sm">
              {([
                { key: 'placeholders', label: '{ } Placeholders' },
                { key: 'versions', label: '🕑 Versions' },
              ] as { key: Sidebar; label: string }[]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSidebarTab(s.key)}
                  className={`flex-1 rounded-lg transition-all ${sidebar === s.key
                    ? 'btn-info'
                    : 'btn-secondary'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {sidebar === 'placeholders' && (
              <PlaceholderPanel
                editor={null /* passed via prop drilling or context in a real app */}
                placeholders={DEFINED_PLACEHOLDERS}
                usedKeys={usedKeys}
                missingKeys={validation.missing}
              />
            )}

            {sidebar === 'versions' && (
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Version History</h3>
                <VersionHistory versions={versions} onRestore={handleRestore} />
              </div>
            )}

            {/* Template JSON preview */}
            <div className="bg-gray-800 p-1 rounded-lg p-4">
              <h3 className="mb-2">Stored JSON</h3>
              <pre className="text-[10px] rounded p-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                {JSON.stringify(
                  {
                    subject,
                    body: body.slice(0, 120) + '…',
                    metadata: {
                      name: 'Captain Credentials Email',
                      placeholders: DEFINED_PLACEHOLDERS.map((p) => p.key),
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}