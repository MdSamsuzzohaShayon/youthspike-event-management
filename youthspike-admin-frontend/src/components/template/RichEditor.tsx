// ─────────────────────────────────────────────────────────────
// components/RichEditor.tsx
// ─────────────────────────────────────────────────────────────
'use client';

import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';
import History from '@tiptap/extension-history';
import { EditorContent, useEditor } from '@tiptap/react';
import React, { useEffect } from 'react';
import styles from './emailEditor.module.scss';
import EditorToolbar from './EditorToolbar';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

export default function RichEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Strike,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      HorizontalRule,
      HardBreak,
      History,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Start typing your email template… use {{placeholder_name}} tokens anywhere.',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  });

  // sync external content changes (e.g. restore version)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className={`p-2 bg-gray-800 p-2 rounded-lg overflow-hidden ${styles.tiptapWrapper}`}>
      <EditorToolbar editor={editor} />
      <div className="overflow-y-auto max-h-[600px] mt-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}