// ─────────────────────────────────────────────────────────────
// components/EditorToolbar.tsx
// ─────────────────────────────────────────────────────────────
'use client';

import { Editor } from '@tiptap/react';
import React from 'react';
import styles from './emailEditor.module.scss';

interface Props {
  editor: Editor | null;
}

type ToolBtn = {
  label: string;
  title: string;
  action: () => void;
  isActive?: () => boolean;
  disabled?: () => boolean;
};

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const buttons: ToolBtn[] = [
    {
      label: 'B',
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      label: 'I',
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      label: 'U',
      title: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      label: 'S',
      title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      label: 'H1',
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      label: 'H2',
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'H3',
      title: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    {
      label: '≡',
      title: 'Bullet list',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      label: '1.',
      title: 'Ordered list',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      label: '"',
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
    {
      label: '—',
      title: 'Horizontal rule',
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      label: '↩',
      title: 'Undo',
      action: () => editor.chain().focus().undo().run(),
      disabled: () => !editor.can().undo(),
    },
    {
      label: '↪',
      title: 'Redo',
      action: () => editor.chain().focus().redo().run(),
      disabled: () => !editor.can().redo(),
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-yellow-400/50">
      {buttons.map((btn, i) => (
        <button
          key={i}
          title={btn.title}
          onClick={btn.action}
          disabled={btn.disabled?.()}
          className={`${styles.toolbarBtn} ${btn.isActive?.() ? styles.active : ''}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}