// components/badge/BadgeInput.tsx
'use client';

import { useCallback, useState, type ReactNode } from "react";
import { EBadgeFor, TAddBadge } from "@/types";
import useOrphanDraftImageCleanup from "@/hooks/useOrphanDraftImageCleanup";
import { useItemEditor } from "@/hooks/useItemEditor";
import { normalizeItemName } from "@/utils/item-helper";
import ItemList from "@/components/elements/ItemList";
import ItemListItem from "@/components/elements/ItemListItem";
import ItemEditorForm from "@/components/elements/ItemEditorForm";
import SelectInput from "@/components/elements/forms/SelectInput";

export interface BadgeInputProps {
  name: string;
  label?: string;
  className?: string;
  compact?: boolean;
  required?: boolean;
  value: TAddBadge[];
  onChange: (badges: TAddBadge[]) => void;
  /** Cloudinary folder new badge images should be uploaded into. */
  folder?: string;
}

// ---------------------------------------------------------------------------
// BadgeInput — top-level component: owns state, wires the pieces together.
// ---------------------------------------------------------------------------

export default function BadgeInput({
  name: fieldName,
  label,
  className = "",
  compact = false,
  required = false,
  value: badges = [],
  onChange,
  folder,
}: BadgeInputProps) {
  // Badge-specific draft state (name + icon live in the shared hook).
  const [draftDescription, setDraftDescription] = useState<string>("");
  const [draftBadgeFor, setDraftBadgeFor] = useState<EBadgeFor>(EBadgeFor.TEAM);

  // Reset badge-specific state whenever the shared editor resets
  // (after a successful submit or a cancel).
  const handleResetBadgeFields = useCallback(() => {
    setDraftDescription("");
    setDraftBadgeFor(EBadgeFor.TEAM);
  }, []);

  const editor = useItemEditor<TAddBadge>({
    items: badges,
    onChange,
    getName: (badge) => badge.name,
    getIcon: (badge) => badge.icon,
    // buildItem closes over the badge-specific draft state so the latest
    // values are used when the user submits. Name is normalized on store
    // to preserve the original "lowercased badge name" behaviour.
    buildItem: ({ name, icon }) => ({
      name: normalizeItemName(name),
      icon,
      description: draftDescription,
      badgeFor: draftBadgeFor,
    }),
    onReset: handleResetBadgeFields,
    missingFieldsError: "Badge name, description, and image are all required.",
    duplicateNameError: "A badge with this name already exists.",
  });

  // Sync badge-specific state when entering edit mode
  // (name + icon are populated by the shared hook).
  const handleEditBadge = useCallback(
    (index: number) => {
      const badge = badges[index];
      if (!badge) return;
      setDraftDescription(badge.description);
      setDraftBadgeFor(badge.badgeFor);
      editor.handleEdit(index);
    },
    [badges, editor],
  );

  // Clean up orphan draft images.
  useOrphanDraftImageCleanup(editor.draftIcon, badges, (b) => b.icon);

  const editorLabelId = `${fieldName}-editor-label`;
  const listId = `${fieldName}-badge-list`;
  const nameHtmlId = `${fieldName}-badge-name`;
  const descriptionHtmlId = `${fieldName}-badge-description`;

  // Extra badge-specific fields rendered between the name and image uploader.
  const extraFields: ReactNode = (
    <>
      <div className="flex flex-1 flex-col gap-1">
        <label
          htmlFor={descriptionHtmlId}
          className="text-xs uppercase tracking-wide text-gray-400"
        >
          Badge Description
        </label>
        <input
          id={descriptionHtmlId}
          type="text"
          value={draftDescription}
          onChange={(event) => setDraftDescription(event.target.value)}
          onKeyDown={editor.handleFieldKeyDown}
          placeholder="e.g. A champion team"
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 placeholder:text-gray-500 transition-colors duration-150 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <SelectInput
          name={`${fieldName}-badgeFor`}
          label="Badge For"
          optionList={Object.values(EBadgeFor).map((bf, i) => ({
            id: i + 1,
            value: bf,
            text: bf.toLowerCase(),
          }))}
          value={draftBadgeFor}
          handleSelect={(event) =>
            setDraftBadgeFor(
              (event.target as HTMLSelectElement).value as EBadgeFor,
            )
          }
        />
      </div>
    </>
  );

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
        items={badges}
        editingIndex={editor.editingIndex}
        compact={compact}
        listId={listId}
        emptyTitle="No badges added yet."
        emptyHint="Create your first badge below."
        renderItem={(badge, isEditing, index) => (
          <ItemListItem
            key={`${badge.name}-${index}`}
            name={badge.name}
            icon={badge.icon}
            isEditing={isEditing}
            ariaEditLabel={`Edit ${badge.name} badge`}
            ariaDeleteLabel={`Delete ${badge.name} badge`}
            onEdit={() => handleEditBadge(index)}
            onDelete={() => editor.handleDelete(index)}
          >
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-200 max-w-[10rem] truncate font-bold text-yellow-logo">
              {badge.badgeFor}
            </span>
          </ItemListItem>
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
        editorTitleAdd="Add a badge"
        editorTitleEdit="Edit badge"
        nameLabel="Badge Name"
        namePlaceholder="e.g. Champion"
        imageLabel="Badge Image"
        submitLabelAdd="Add Badge"
        submitLabelEdit="Update Badge"
        cancelLabel="Cancel editing badge"
      >
        {extraFields}
      </ItemEditorForm>

      <p className="text-xs text-gray-500">
        Upload an image and give the badge a unique name, then add it to the
        list above. Supported formats: PNG, JPEG, GIF, WebP (max 5MB).
      </p>

      {/* Hidden input for form integration */}
      <input type="hidden" name={fieldName} value={JSON.stringify(badges)} />
    </div>
  );
}