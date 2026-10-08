// components/sponsor/SponsorInput.tsx
'use client';
import type { TAddSponsor } from "@/types";

import useOrphanDraftImageCleanup from "@/hooks/useOrphanDraftImageCleanup";
import { useItemEditor } from "@/hooks/useItemEditor";
    import ItemList from "@/components/elements/ItemList";
    import ItemListItem from "@/components/elements/ItemListItem";
    import ItemEditorForm from "@/components/elements/ItemEditorForm";

export interface SponsorInputProps {
  name: string;
  label?: string;
  className?: string;
  compact?: boolean;
  required?: boolean;
  value: TAddSponsor[];
  onChange: (sponsors: TAddSponsor[]) => void;
  /** Cloudinary folder new sponsor logos should be uploaded into. */
  folder?: string;
}

/**
 * Editor for a list of event sponsors — same UX as BadgeInput but
 * tailored to the simpler sponsor shape ({ company, logo }).
 *
 * Logos are uploaded via ImageUploader and stored as Cloudinary public_ids,
 * mirroring how badges store their icons. No Blob / File ever leaves
 * this component.
 */
export default function SponsorInput({
  name: fieldName,
  label,
  className = "",
  compact = false,
  required = false,
  value: sponsors = [],
  onChange,
  folder,
}: SponsorInputProps) {
  const editor = useItemEditor<TAddSponsor>({
    items: sponsors,
    onChange,
    getName: (sponsor) => sponsor.company,
    getIcon: (sponsor) => sponsor.logo,
    // Company names preserve their original casing on store (we only
    // lowercase for duplicate detection, inside the hook).
    buildItem: ({ name, icon }) => ({ company: name, logo: icon }),
    missingFieldsError: "Company name and logo are both required.",
    duplicateNameError: "A sponsor with this name already exists.",
  });

  // Clean up orphan draft logos so we don't accumulate unused Cloudinary assets.
  useOrphanDraftImageCleanup(editor.draftIcon, sponsors, (s) => s.logo);

  const editorLabelId = `${fieldName}-editor-label`;
  const listId = `${fieldName}-list`;
  const nameHtmlId = `${fieldName}-company`;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {label && (
        <label
          htmlFor={nameHtmlId}
          className="text-sm uppercase tracking-wide text-gray-300 font-medium"
        >
          {label}
          {required && <span className="text-yellow-500 ml-1">*</span>}
        </label>
      )}

      <ItemList
        items={sponsors}
        editingIndex={editor.editingIndex}
        compact={compact}
        listId={listId}
        emptyTitle="No sponsors added yet."
        emptyHint="Add your first sponsor below."
        renderItem={(sponsor, isEditing, index) => (
          <ItemListItem
            key={`${sponsor.company}-${index}`}
            name={sponsor.company}
            icon={sponsor.logo}
            isEditing={isEditing}
            ariaEditLabel={`Edit ${sponsor.company} sponsor`}
            ariaDeleteLabel={`Delete ${sponsor.company} sponsor`}
            onEdit={() => editor.handleEdit(index)}
            onDelete={() => editor.handleDelete(index)}
          />
        )}
      />

      <ItemEditorForm
        fieldName={fieldName}
        editorLabelId={editorLabelId}
        compact={compact}
        isEditing={editor.isEditing}
        isUploading={editor.isUploading}
        isDraftValid={editor.isDraftValid}
        draftName={editor.draftName}
        draftIcon={editor.draftIcon}
        formError={editor.formError}
        folder={folder}
        nameInputRef={editor.nameInputRef}
        nameHtmlId={nameHtmlId}
        onDraftNameChange={editor.setDraftName}
        onNameFieldKeyDown={editor.handleFieldKeyDown}
        onDraftIconChange={editor.setDraftIcon}
        onUploadStart={editor.handleUploadStart}
        onUploadEnd={editor.handleUploadEnd}
        onUploadError={editor.setFormError}
        onSubmit={editor.handleSubmit}
        onCancel={editor.handleCancel}
        editorTitleAdd="Add a sponsor"
        editorTitleEdit="Edit sponsor"
        nameLabel="Company Name"
        namePlaceholder="e.g. Acme Inc."
        imageLabel="Sponsor Logo"
        submitLabelAdd="Add Sponsor"
        submitLabelEdit="Update Sponsor"
        cancelLabel="Cancel editing sponsor"
      />

      <p className="text-xs text-gray-500">
        Upload a logo and give the sponsor a unique name, then add it to the
        list above. Supported formats: PNG, JPEG, GIF, WebP (max 5MB).
      </p>

      {/* Hidden input for form integration */}
      <input type="hidden" name={fieldName} value={JSON.stringify(sponsors)} />
    </div>
  );
}