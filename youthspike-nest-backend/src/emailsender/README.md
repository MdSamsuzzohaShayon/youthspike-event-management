# Email Template Editor – Setup Guide

## File Structure

```
email-template-editor/
├── NewTemplatePage.tsx          ← Drop-in Next.js page
├── types/index.ts               ← Shared TypeScript types
├── utils/
│   ├── template.ts              ← Placeholder helpers, sanitization
│   └── defaultData.ts           ← Default template, placeholders, sample users
├── hooks/
│   └── useTemplateVersions.ts   ← Version history hook
├── components/
│   ├── RichEditor.tsx           ← TipTap editor wrapper
│   ├── EditorToolbar.tsx        ← Formatting toolbar
│   ├── PlaceholderPanel.tsx     ← Sidebar placeholder chips
│   ├── EmailPreview.tsx         ← Sandboxed iframe preview
│   ├── SampleUserSelector.tsx   ← Dropdown to pick preview user
│   └── VersionHistory.tsx       ← Version list with restore
├── styles/
│   └── emailEditor.module.scss  ← Custom SCSS (TipTap ProseMirror, chips, etc.)
└── backend/
    └── email-template.resolver.ts  ← NestJS GraphQL resolver
```

## Frontend – Next.js

### 1. Install dependencies

```bash
# TipTap core + extensions used in RichEditor
npm install @tiptap/react @tiptap/pm \
  @tiptap/extension-document \
  @tiptap/extension-paragraph \
  @tiptap/extension-text \
  @tiptap/extension-bold \
  @tiptap/extension-italic \
  @tiptap/extension-underline \
  @tiptap/extension-strike \
  @tiptap/extension-heading \
  @tiptap/extension-bullet-list \
  @tiptap/extension-ordered-list \
  @tiptap/extension-list-item \
  @tiptap/extension-blockquote \
  @tiptap/extension-horizontal-rule \
  @tiptap/extension-hard-break \
  @tiptap/extension-link \
  @tiptap/extension-placeholder \
  @tiptap/extension-history

# Sanitization (both browser + server)
npm install isomorphic-dompurify
npm install --save-dev @types/dompurify

# SCSS support (if not already in project)
npm install --save-dev sass
```

### 2. Tailwind CSS

Make sure `tailwind.config.js` includes the editor files:

```js
content: [
  './app/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  // add the editor folder path
]
```

### 3. Use the page

```tsx
// app/templates/new/page.tsx  (App Router)
export { default } from '@/email-template-editor/NewTemplatePage';

// OR pages/templates/new.tsx  (Pages Router)
export { default } from '@/email-template-editor/NewTemplatePage';
```

> **Important:** Add `'use client'` to the page if using the App Router
> (already included in `NewTemplatePage.tsx`).

---

## Backend – NestJS GraphQL

### 1. Install dependencies

```bash
npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express \
            isomorphic-dompurify class-validator class-transformer
```

### 2. Register in AppModule

```ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { EmailTemplateResolver } from './email-template.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [EmailTemplateResolver],
})
export class AppModule {}
```

### 3. Key GraphQL operations

```graphql
# Save a new template
mutation SaveTemplate($input: SaveTemplateInput!) {
  saveTemplate(input: $input) { id subject body }
}

# Validate placeholders before sending
query Validate($subject: String!, $body: String!, $definedKeys: [String!]!, $sampleValuesJson: String!) {
  validateTemplate(subject: $subject, body: $body, definedKeys: $definedKeys, sampleValuesJson: $sampleValuesJson) {
    valid missing unused
  }
}

# Send email with placeholder replacement
mutation Send($input: SendEmailInput!) {
  sendTemplateEmail(input: $input) { success error }
}

# Version history
query Versions($templateId: ID!) {
  listVersions(templateId: $templateId) { versionId label savedAt }
}
```

---

## Security Notes

- All HTML from TipTap is sanitized via **DOMPurify** before storage (backend) and before rendering in the preview iframe.
- The preview iframe uses `sandbox="allow-same-origin"` to prevent script execution.
- Each placeholder replacement value is individually stripped of HTML tags.
- The backend validates that no undeclared `{{keys}}` exist in the template before saving.