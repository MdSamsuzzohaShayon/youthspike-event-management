// ─────────────────────────────────────────────────────────────
// hooks/useTemplateVersions.ts
// ─────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { TemplateVersion } from '../types';
import { generateVersionLabel } from '@/utils/templates';

const MAX_VERSIONS = 20;

export function useTemplateVersions() {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);

  const saveVersion = useCallback(
    (partial: Omit<TemplateVersion, 'versionId' | 'savedAt' | 'label'>) => {
      const newVersion: TemplateVersion = {
        ...partial,
        versionId: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        label: generateVersionLabel(versions.length),
      };
      setVersions((prev) => {
        const next = [newVersion, ...prev];
        return next.slice(0, MAX_VERSIONS);
      });
      return newVersion;
    },
    [versions.length],
  );

  const restoreVersion = useCallback((v: TemplateVersion) => v, []);

  return { versions, saveVersion, restoreVersion };
}