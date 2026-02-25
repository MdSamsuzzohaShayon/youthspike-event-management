// ─────────────────────────────────────────────────────────────
// components/VersionHistory.tsx
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { TemplateVersion } from '@/types';
import styles from './emailEditor.module.scss';

interface Props {
  versions: TemplateVersion[];
  onRestore: (v: TemplateVersion) => void;
}

export default function VersionHistory({ versions, onRestore }: Props) {
  if (versions.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic px-1">
        No saved versions yet. Save the template to create a version.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {versions.map((v) => (
        <div key={v.versionId} className={styles.versionItem}>
          <div>
            <p className="font-medium text-slate-700 text-xs">{v.label}</p>
            <p className="text-slate-400 text-[11px]">{new Date(v.savedAt).toLocaleString()}</p>
          </div>
          <button
            onClick={() => onRestore(v)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}