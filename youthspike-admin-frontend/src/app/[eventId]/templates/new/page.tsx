// ─────────────────────────────────────────────────────────────
// NewTemplatePage.tsx  (Next.js page component)
// Updated architecture:
//   TipTap → Email Transform → Email-safe HTML → Store/Preview
// ─────────────────────────────────────────────────────────────
'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_BODY,
  DEFAULT_NAME,
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
import {
  ETemplateType,
  IResponse,
  ITemplate,
  ITemplateCreate,
  TemplateVersion,
  TPlaceholder,
} from '@/types';
import InputField from '@/components/elements/forms/InputField';
import { useMutation } from '@apollo/client/react';
import { SAVE_TEMPLATE } from '@/graphql/templates';
import { useParams, useRouter } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';
import { Editor } from '@tiptap/react';
import { transformToEmailHtml, wrapEmailShell } from '@/utils/emailTransformer';
import { useMessage } from '@/lib/MessageProvider';

type Tab = 'editor' | 'preview';
type Sidebar = 'placeholders' | 'versions';

interface ICreateTemplate extends IResponse {
  data: ITemplate;
}
type CreateTemplateMutationData = { createTemplate: ICreateTemplate };
type CreateTemplateMutationVars = { input: ITemplateCreate };

export default function NewTemplatePage() {
  const [createTemplate] = useMutation<CreateTemplateMutationData, CreateTemplateMutationVars>(SAVE_TEMPLATE);
  const params = useParams();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { showMessage } = useMessage();

  // ── Editor ref (passed down for PlaceholderPanel) ──────────
  const editorRef = useRef<Editor | null>(null);

  // ── State ──────────────────────────────────────────────────
  const [name, setName] = useState(DEFAULT_NAME);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY); // raw TipTap HTML
  const [tab, setTab] = useState<Tab>('editor');
  const [sidebar, setSidebar] = useState<Sidebar>('placeholders');
  const [selectedUser, setSelectedUser] = useState(SAMPLE_USERS[0]);

  const { versions, restoreVersion } = useTemplateVersions();

  // ── Derived ────────────────────────────────────────────────
  const usedKeys = useMemo(() => extractPlaceholders(body + subject), [body, subject]);
  
  // Filter to only valid TPlaceholder values
  const validPlaceholders = useMemo(() => {
    const validSet = new Set<TPlaceholder>([
      'tournamentName',
      'playerName',
      'startDate',
      'teamName',
      'matchTime',
      'courtNumber',
    ]);
    return usedKeys.filter((key): key is TPlaceholder => validSet.has(key as TPlaceholder));
  }, [usedKeys]);

  const validation = useMemo(
    () =>
      validatePlaceholders(
        body + subject,
        selectedUser,
        DEFINED_PLACEHOLDERS.map((p) => p.key),
      ),
    [body, subject, selectedUser],
  );

  // Compiled email-safe HTML (run through transform pipeline)
  const compiledEmailHtml = useMemo(() => {
    const transformed = transformToEmailHtml(body);
    return wrapEmailShell(transformed, subject);
  }, [body, subject]);

  // ── Actions ────────────────────────────────────────────────
  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const { eventId } = params;
      const input: ITemplateCreate = {
        name,
        type: ETemplateType.TEAM,
        default: false,
        subject,
        body: compiledEmailHtml, // store the email-safe compiled version
        images: [],
        placeholders: validPlaceholders,
        event: String(eventId),
      };
      const response = await createTemplate({ variables: { input } });
      if (response?.data?.createTemplate?.code === 201) {
        router.push(`/${eventId}/templates/${ldoIdUrl}`);
      } else {
        showMessage({
          code: response?.data?.createTemplate?.code,
          message: response?.data?.createTemplate?.message || 'Internal Server Error',
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      showMessage({ code: 400, message: err?.message || 'Internal Server Error', type: "error" });
    }
  };

  const handleRestore = useCallback(
    (v: TemplateVersion) => {
      const restored = restoreVersion(v);
      setSubject(restored.subject);
      setBody(restored.body);
      setSidebar('placeholders');
    },
    [restoreVersion],
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Header ── */}
      <header className="py-4 shadow-sm border-b border-yellow-500/50">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Email Template Editor</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Use the Placeholders panel to insert{' '}
              <code className="bg-gray-300 text-gray-800 px-1 rounded font-mono">{'{{tokens}}'}</code>{' '}
              as semantic nodes
            </p>
          </div>

          <div className="flex flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {validation.missing.length > 0 ? (
              <span className="btn-danger">
                ⚠ {validation.missing.length} missing value{validation.missing.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="btn-success">✓ All placeholders resolved</span>
            )}

            <button onClick={handleSave} className="btn-info">
              Save Template
            </button>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <main className="max-w-screen-2xl">
        <div className="flex flex-col lg:flex-row gap-5 mt-4">

          {/* ── Left: Editor or Preview ── */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
            <InputField
              name="name"
              type="text"
              handleInputChange={(e) => setName(e.target.value)}
            />
            <InputField
              type="text"
              name="subject"
              handleInputChange={(e) => setSubject(e.target.value)}
            />

            {/* Sample user selector (only visible in preview) */}
            {tab === 'preview' && (
              <SampleUserSelector
                users={SAMPLE_USERS}
                selected={selectedUser}
                onChange={setSelectedUser}
              />
            )}

            {tab === 'editor' ? (
              <RichEditor
                content={body}
                onChange={setBody}
                missingPlaceholderKeys={validation.missing}
              />
            ) : (
              <EmailPreview
                html={body}
                subject={subject}
                sampleUser={selectedUser}
              />
            )}
          </div>

          {/* ── Right sidebar ── */}
          <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

            {/* Editor / Preview toggle */}
            <div className="inline-flex rounded-lg p-1 gap-1 shadow-sm w-full">
              {(['editor', 'preview'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={tab === t ? 'btn-info' : 'btn-secondary'}
                >
                  {t === 'editor' ? '✏️ Editor' : '👁 Preview'}
                </button>
              ))}
            </div>

            {/* Sidebar tab toggle */}
            {/* <div className="inline-flex rounded-lg p-1 gap-1 shadow-sm w-full">
              {(['placeholders', 'versions'] as Sidebar[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSidebar(s)}
                  className={sidebar === s ? 'btn-info' : 'btn-secondary'}
                >
                  {s === 'placeholders' ? '{ } Placeholders' : '🕐 Versions'}
                </button>
              ))}
            </div> */}

            {sidebar === 'placeholders' && (
              <PlaceholderPanel
                editor={editorRef.current}
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

            {/* Compiled email JSON preview */}
            <div className="bg-gray-800 p-4 rounded-lg overflow-hidden">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Stored JSON
              </h3>
              <pre className="text-[10px] rounded p-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all text-gray-300">
                {JSON.stringify(
                  {
                    name,
                    subject,
                    placeholders: usedKeys,
                    bodyPreview: body.slice(0, 80) + '…',
                    compiledPreview: compiledEmailHtml.slice(0, 80) + '…',
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