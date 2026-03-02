// ─────────────────────────────────────────────────────────────
// components/template/RichEditor.tsx
// Enhanced TipTap editor with:
//  - Debounced onChange (300ms)
//  - Lazy loading via dynamic import
//  - Placeholder Node extension
//  - Removed: Images, CodeBlock, Subscript, Superscript, Highlight
//  - Working: BulletList, OrderedList, Color, Text styles
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';

// Core
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';

// Marks
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';

// Text style & colour — BOTH required for Color to work
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

// Headings & blocks
import Heading from '@tiptap/extension-heading';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

// Lists (ListItem must be before BulletList/OrderedList)
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';

// Alignment
import TextAlign from '@tiptap/extension-text-align';

// Link
import Link from '@tiptap/extension-link';

// Table
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

// Placeholder hint
import Placeholder from '@tiptap/extension-placeholder';


import styles from './emailEditor.module.scss';
import EditorToolbar from './EditorToolbar';
import { PlaceholderNodeWithCommands } from './PlaceholderNode';

interface Props {
  content: string;
  onChange: (html: string) => void;
  missingPlaceholderKeys?: string[];
}

export default function RichEditor({ content, onChange, missingPlaceholderKeys = [] }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Lazy mount — avoids SSR issues
  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (html: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(html);
      }, 300);
    },
    [onChange],
  );

  const editor = useEditor(
    {
      extensions: [
        // ── Core ────────────────────────────────────────
        Document,
        Paragraph,
        Text,
        HardBreak,
        History,
        Dropcursor,
        Gapcursor,

        // ── Marks ───────────────────────────────────────
        Bold,
        Italic,
        Underline,
        Strike,

        // ── Text style + color (Color requires TextStyle) ──
        TextStyle,
        Color,

        // ── Headings & blocks ───────────────────────────
        Heading.configure({ levels: [1, 2, 3] }),
        Blockquote,
        HorizontalRule,

        // ── Lists ───────────────────────────────────────
        ListItem,
        BulletList.configure({ keepMarks: true, keepAttributes: true }),
        OrderedList.configure({ keepMarks: true, keepAttributes: true }),

        // ── Alignment ───────────────────────────────────
        TextAlign.configure({ types: ['heading', 'paragraph'] }),

        // ── Link ────────────────────────────────────────
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'tiptap-link',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        }),

        // ── Table ────────────────────────────────────────
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,

        // ── Placeholder hint ────────────────────────────
        Placeholder.configure({
          placeholder: 'Start typing… use the Placeholders panel to insert {{tokens}}.',
        }),

        // ── Custom Placeholder Node ─────────────────────
        PlaceholderNodeWithCommands,
      ],
      content,
      onUpdate: ({ editor }) => {
        handleChange(editor.getHTML());
      },
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: 'focus:outline-none',
        },
      },
    },
    [isMounted], // recreate editor after mount
  );

  // Sync external content (e.g. version restore)
  const lastSyncedContent = useRef(content);
  useEffect(() => {
    if (!editor || content === lastSyncedContent.current) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
      lastSyncedContent.current = content;
    }
  }, [content, editor]);

  // Update placeholder node missing state reactively
  useEffect(() => {
    if (!editor) return;
    // Force re-render to reflect missing states in chips
    editor.view.dispatch(editor.state.tr);
  }, [missingPlaceholderKeys, editor]);

  if (!isMounted) {
    return (
      <div className={`bg-gray-800 rounded-lg overflow-hidden ${styles.tiptapWrapper}`}>
        <div className="h-12 bg-gray-700 animate-pulse" />
        <div style={{ minHeight: 420, background: '#fff' }} className="flex items-center justify-center text-gray-400 text-sm">
          Loading editor…
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden ${styles.tiptapWrapper}`}>
      <EditorToolbar editor={editor} />
      <div className="overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}