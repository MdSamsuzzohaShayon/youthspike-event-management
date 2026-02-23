// ─────────────────────────────────────────────────────────────
// components/PlaceholderPanel.tsx
// ─────────────────────────────────────────────────────────────
'use client';

import { Editor } from '@tiptap/react';
import styles from './emailEditor.module.scss';
import { ITemplatePlaceholder } from '@/types';

interface Props {
  editor: Editor | null;
  placeholders: ITemplatePlaceholder[];
  usedKeys: string[];
  missingKeys: string[];
}

export default function PlaceholderPanel({ editor, placeholders, usedKeys, missingKeys }: Props) {
  const insertPlaceholder = (key: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`{{${key}}}`).run();
  };

  return (
    <div className="h-full">
      <h3 className="">Placeholders</h3>
      <p className=" mb-2">Click to insert into editor</p>

      <div className="flex flex-col gap-2">
        {placeholders.map((p) => {
          const isUsed = usedKeys.includes(p.key);
          const isMissing = missingKeys.includes(p.key);
          return (
            <button
              key={p.key}
              onClick={() => insertPlaceholder(p.key)}
              className={`rounded-sm bg-gray-800 p-1 ${styles.placeholderChip} ${isMissing ? styles.missing : ''} text-left`}
              title={`Sample: ${p.sampleValue}${!isUsed ? ' (not used in template)' : ''}`}
            >
              <span className="opacity-60 text-[10px]">{isUsed ? '✓' : '+'}</span>
              <span>{`{{${p.key}}}`}</span>
            </button>
          );
        })}
      </div>

      {missingKeys.length > 0 && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Missing sample values:</strong>
          <ul className="list-disc ml-3 mt-1">
            {missingKeys.map((k) => <li key={k}>{k}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}