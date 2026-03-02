// ─────────────────────────────────────────────────────────────
// extensions/PlaceholderNode.ts
// Custom TipTap Node for semantic placeholders
// Renders as: <span data-placeholder="key">{{key}}</span>
// ─────────────────────────────────────────────────────────────

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

// ── React view component for the node ────────────────────────
export const PlaceholderChipView = ({
  node,
  selected,
}: {
  node: any;
  selected: boolean;
}) => {
  const key = node.attrs.key as string;
  const missing = node.attrs.missing as boolean;

  return (
    <NodeViewWrapper
      as="span"
      style={{ display: 'inline-block' }}
      contentEditable={false}
    >
      <span
        data-placeholder={key}
        data-type="placeholder-node"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '1px 6px',
          borderRadius: '4px',
          fontSize: '0.78em',
          fontFamily: 'monospace',
          fontWeight: 600,
          cursor: 'default',
          userSelect: 'none',
          border: `1.5px solid ${missing ? '#fda4af' : '#818cf8'}`,
          background: missing ? '#fff1f2' : '#ede9fe',
          color: missing ? '#be123c' : '#4338ca',
          outline: selected ? '2px solid #4338ca' : 'none',
          outlineOffset: '1px',
          transition: 'all 0.1s',
          verticalAlign: 'middle',
        }}
        title={missing ? `Missing value for ${key}` : `Placeholder: ${key}`}
      >
        {missing ? '⚠ ' : ''}
        {`{{${key}}}`}
      </span>
    </NodeViewWrapper>
  );
};

// ── TipTap Node definition ────────────────────────────────────
export const PlaceholderNode = Node.create({
  name: 'placeholderNode',

  group: 'inline',
  inline: true,
  atom: true, // non-editable atom — behaves like a character
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      key: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-placeholder') ?? '',
        renderHTML: (attrs) => ({ 'data-placeholder': attrs.key }),
      },
      missing: {
        default: false,
        parseHTML: () => false, // derived at render time
        renderHTML: () => ({}), // don't persist
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]',
        getAttrs: (el) => {
          const node = el as HTMLElement;
          return { key: node.getAttribute('data-placeholder') ?? '' };
        },
      },
      // Also parse legacy {{key}} text patterns
      {
        tag: 'span[data-type="placeholder-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const key = HTMLAttributes['data-placeholder'] ?? '';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'placeholder-node',
        'data-placeholder': key,
        class: 'tiptap-placeholder-node',
        style:
          'display:inline;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.85em;background:#ede9fe;color:#4338ca;border:1px solid #818cf8',
        contenteditable: 'false',
      }),
      `{{${key}}}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlaceholderChipView);
  },
});

// ── Command to insert a placeholder ──────────────────────────
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    placeholderNode: {
      insertPlaceholder: (key: string) => ReturnType;
    };
  }
}

export const PlaceholderNodeWithCommands = PlaceholderNode.extend({
  addCommands() {
    return {
      insertPlaceholder:
        (key: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { key },
          });
        },
    };
  },
});