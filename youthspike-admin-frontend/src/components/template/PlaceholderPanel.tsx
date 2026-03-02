// ─────────────────────────────────────────────────────────────
// components/template/PlaceholderPanel.tsx
// Inserts PlaceholderNode (custom TipTap atom) into the editor
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { Editor } from '@tiptap/react';
import styles from './emailEditor.module.scss';

interface PlaceholderDef {
  key: string;
  label: string;
  description?: string;
  example?: string;
}

interface Props {
  editor: Editor | null;
  placeholders: PlaceholderDef[];
  usedKeys: string[];
  missingKeys: string[];
}

export default function PlaceholderPanel({ editor, placeholders, usedKeys, missingKeys }: Props) {
  const insertPlaceholder = (key: string) => {
    if (!editor) return;
    (editor.chain().focus() as any).insertPlaceholder(key).run();
  };

  return (
    <div className="bg-gray-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-0.5">Placeholders</h3>
        <p className="text-xs text-slate-400">Click to insert into editor at cursor position.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {placeholders.map((p) => {
          const isUsed = usedKeys.includes(p.key);
          const isMissing = missingKeys.includes(p.key);

          return (
            <button
              key={p.key}
              onClick={() => insertPlaceholder(p.key)}
              title={p.description ?? p.key}
              disabled={!editor}
              className={`
                flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left
                border transition-all text-xs
                ${isMissing
                  ? 'bg-red-950/40 border-red-700/60 text-red-300 hover:bg-red-900/50'
                  : isUsed
                  ? 'bg-indigo-950/40 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/50'
                  : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono font-semibold truncate">{`{{${p.key}}}`}</span>
                {p.label !== p.key && (
                  <span className="text-slate-400 text-[10px]">{p.label}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isMissing && <span title="No sample value">⚠</span>}
                {isUsed && !isMissing && <span title="Used in template" className="text-indigo-400">✓</span>}
                <span className="text-slate-500">+</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Status summary */}
      <div className="pt-2 border-t border-slate-700 flex flex-col gap-1">
        <div className="text-[10px] text-slate-500 flex justify-between">
          <span>Used: <strong className="text-slate-300">{usedKeys.length}</strong></span>
          <span>Missing values: <strong className={missingKeys.length > 0 ? 'text-red-400' : 'text-green-400'}>{missingKeys.length}</strong></span>
        </div>
        {missingKeys.length > 0 && (
          <p className="text-[10px] text-red-400 leading-relaxed">
            Missing sample values for: {missingKeys.map(k => `{{${k}}}`).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}