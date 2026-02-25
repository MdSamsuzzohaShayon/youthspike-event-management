// ─────────────────────────────────────────────────────────────
// components/EmailPreview.tsx
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { ISampleUser } from '@/types';
import { replacePlaceholders, sanitizeHtml } from '@/utils/templates';

interface Props {
  html: string;
  subject: string;
  sampleUser: ISampleUser;
}

export default function EmailPreview({ html, subject, sampleUser }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const rendered = replacePlaceholders(html, sampleUser.values, true);
    const safe = sanitizeHtml(rendered);
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(safe);
    doc.close();
  }, [html, sampleUser]);

  const previewSubject = replacePlaceholders(subject, sampleUser.values, true).replace(/<[^>]*>/g, '');

  return (
    <div className="flex flex-col gap-3">
      {/* Subject preview */}
      <div className="bg-gray-800 rounded-lg p-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Subject:</span>
        <span className="text-sm">{previewSubject || <em >No subject</em>}</span>
      </div>

      {/* Email body preview */}
      <div className=" rounded-sm overflow-hidden shadow-sm">
        <iframe
          ref={iframeRef}
          title="Email preview"
          sandbox="allow-same-origin"
          className="w-full min-h-[600px] bg-gray-800"
        />
      </div>
    </div>
  );
}