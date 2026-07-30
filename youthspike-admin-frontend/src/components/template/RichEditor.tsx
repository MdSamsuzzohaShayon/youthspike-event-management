// ─────────────────────────────────────────────────────────────
// components/template/RichEditor.tsx
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

// Text style & colour
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

// Headings & blocks
import Heading from '@tiptap/extension-heading';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

// Lists
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

// FIX: Correct the import path
import styles from './emailEditor.module.scss';
import EditorToolbar from './EditorToolbar';
import { PlaceholderNodeWithCommands } from './PlaceholderNode';

interface Props {
  content: string;
  onChange: (html: string) => void;
  missingPlaceholderKeys?: string[];
}

// Add this cleaning function
function cleanEditorHTML(html: string): string {
  if (!html) return '';
  
  return html
    // Remove ALL border styles from table cells
    .replace(/border\s*:\s*1px\s+solid\s+#[a-fA-F0-9]+;?/gi, '')
    // Remove min-width from tables and cols
    .replace(/min-width\s*:\s*\d+px;?/gi, '')
    // Remove TipTap default text colors
    .replace(/color\s*:\s*#374151;?/gi, '')
    // Remove default font sizes
    .replace(/font-size\s*:\s*14px;?/gi, '')
    // Remove colgroup elements entirely
    .replace(/<colgroup>[\s\S]*?<\/colgroup>/g, '')
    // Remove colspan="1" and rowspan="1"
    .replace(/\s*colspan="1"/g, '')
    .replace(/\s*rowspan="1"/g, '')
    // Remove text-align:left (browser default)
    .replace(/text-align\s*:\s*left;?/gi, '')
    // Remove vertical-align:top
    .replace(/vertical-align\s*:\s*top;?/gi, '')
    // Clean up empty style attributes
    .replace(/\s*style="\s*;?\s*"/g, '')
    .replace(/\s*style=""/g, '')
    // Clean up multiple semicolons
    .replace(/;;+/g, ';')
    // Remove trailing semicolons in style
    .replace(/style="([^"]*);"/g, 'style="$1"');
}


export default function RichEditor({ content, onChange, missingPlaceholderKeys = [] }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<any>(null);

  // FIX: Remove lazy mount state, use immediate rendering
  const handleChange = useCallback(
    (html: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // Clean HTML before sending to parent
        const cleanedHtml = cleanEditorHTML(html);
        onChange(cleanedHtml);
      }, 300);
    },
    [onChange],
  );

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      History,
      Dropcursor,
      Gapcursor,
      Bold,
      Italic,
      Underline,
      Strike,
      TextStyle,
      Color,
      Heading.configure({ levels: [1, 2, 3] }),
      Blockquote,
      HorizontalRule,
      ListItem,
      BulletList.configure({
        keepMarks: true,
        keepAttributes: true,
        HTMLAttributes: {
          class: 'email-list'
        }
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: true,
        HTMLAttributes: {
          class: 'email-list'
        }
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      /*
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'email-table'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'email-table-header'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'email-table-cell'
        }
      }),
      */
      // IMPORTANT: Configure Table without default borders
      Table.configure({ 
        resizable: true,
        HTMLAttributes: {
          style: 'border-collapse:collapse;',
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          style: 'padding:8px;',
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          style: 'padding:8px;',
        }
      }),
      Placeholder.configure({
        placeholder: 'Start typing… use the Placeholders panel to insert {{tokens}}.',
      }),
      PlaceholderNodeWithCommands,
    ],
    content,
    onUpdate: ({ editor }) => {
      handleChange(editor.getHTML());
    },
    // FIX: Enable immediate rendering for better content sync
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
      },
    },
  });

  // Store editor reference
  editorRef.current = editor;

  // FIX: Better content synchronization
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (content !== currentContent) {
      // Only update if content actually changed externally
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Update placeholder node missing state reactively
  useEffect(() => {
    if (!editor) return;
    // Force re-render to reflect missing states in chips
    editor.view.dispatch(editor.state.tr);
  }, [missingPlaceholderKeys, editor]);

  // FIX: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className={`bg-gray-800 rounded-lg overflow-hidden ${styles.tiptapWrapper}`}>
        <div className="p-4">
          <div className="h-12 bg-gray-700 animate-pulse rounded mb-2" />
          <div style={{ minHeight: 420, background: '#fff' }} className="flex items-center justify-center text-gray-400 text-sm rounded">
            Loading editor…
          </div>
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