// ─────────────────────────────────────────────────────────────
// components/template/EmailPreview.tsx
// Isolated iframe preview — no app CSS leakage, no Tailwind, no dark mode
// Uses the full email shell with inline styles
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { ISampleUser } from '@/types';
import { replacePlaceholders } from '@/utils/templates';
import { transformToEmailHtml, wrapEmailShell } from '@/utils/emailTransformer';


interface Props {
  html: string;
  subject: string;
  sampleUser: ISampleUser;
}

// Build the complete email document for the iframe
function buildPreviewDocument(html: string, subject: string, sampleUser: ISampleUser): string {
  // 1. Replace placeholders with sample values
  const withValues = replacePlaceholders(html, sampleUser.values, false);

  // 2. Transform TipTap HTML → email-safe HTML
  const emailBody = transformToEmailHtml(withValues);

  // 3. Wrap in full email shell (proper reset + table layout)
  return wrapEmailShell(emailBody, subject);
}

export default function EmailPreview({ html, subject, sampleUser }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const fullDocument = buildPreviewDocument(html, subject, sampleUser);

    doc.open();
    doc.write(fullDocument);
    doc.close();

    // Auto-resize iframe height to content
    const resize = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      try {
        const height = iframe.contentDocument?.body?.scrollHeight ?? 600;
        iframe.style.height = `${height + 32}px`;
      } catch {
        // cross-origin guard (shouldn't happen with sandbox="allow-same-origin")
      }
    };

    // Resize after content paints
    const id = setTimeout(resize, 100);
    iframeRef.current?.contentWindow?.addEventListener('resize', resize);

    return () => {
      clearTimeout(id);
    };
  }, [html, subject, sampleUser]);

  const previewSubject = replacePlaceholders(subject, sampleUser.values, false).replace(/<[^>]*>/g, '');

  return (
    <div className="flex flex-col gap-3">
      {/* Subject line preview */}
      <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Subject:</span>
        <span className="text-sm text-white">{previewSubject || <em className="text-gray-500">No subject</em>}</span>
      </div>

      {/* Rendered email preview — fully isolated */}
      <div className="rounded-lg overflow-hidden border border-slate-700 shadow-lg">
        {/* Mock email client chrome */}
        <div className="bg-slate-700 px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="text-xs text-slate-400 ml-2">Email Preview</span>
        </div>

        <iframe
          ref={iframeRef}
          title="Email preview"
          // allow-same-origin lets us write to the doc; no scripts
          sandbox="allow-same-origin"
          style={{
            width: '100%',
            minHeight: 600,
            border: 'none',
            display: 'block',
            background: '#f8fafc',
          }}
        />
      </div>
    </div>
  );
}