// components/common/ItemEditorForm.tsx
import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import ImageUploader from "../elements/forms/ImageUploader";
import { Loader2 } from "lucide-react";
import { CldImage } from "next-cloudinary";
import { getItemPanelClassName } from "@/utils/item-helper";

interface ItemEditorFormProps {
  fieldName: string;
  editorLabelId: string;
  compact: boolean;
  isEditing: boolean;
  isUploading: boolean;
  isDraftValid: boolean;
  draftName: string;
  draftIcon: string;
  formError: string | null;
  folder?: string;
  nameInputRef: RefObject<HTMLInputElement | null>;
  nameHtmlId?: string;
  onDraftNameChange: (value: string) => void;
  onNameFieldKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onDraftIconChange: (publicId: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onUploadError: (message: string) => void;
  onSubmit: () => void;
  onCancel: () => void;

  // Customizable labels
  editorTitleAdd?: string;
  editorTitleEdit?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  imageLabel?: string;
  submitLabelAdd?: string;
  submitLabelEdit?: string;
  cancelLabel?: string;

  // Extra fields rendered between name and image uploader
  children?: ReactNode;
}

const ItemEditorForm: React.FC<ItemEditorFormProps> = ({
  fieldName,
  editorLabelId,
  compact,
  isEditing,
  isUploading,
  isDraftValid,
  draftName,
  draftIcon,
  formError,
  folder,
  nameInputRef,
  nameHtmlId,
  onDraftNameChange,
  onNameFieldKeyDown,
  onDraftIconChange,
  onUploadStart,
  onUploadEnd,
  onUploadError,
  onSubmit,
  onCancel,
  editorTitleAdd = "Add item",
  editorTitleEdit = "Edit item",
  nameLabel = "Name",
  namePlaceholder = "e.g. Item name",
  imageLabel = "Image",
  submitLabelAdd = "Add",
  submitLabelEdit = "Update",
  cancelLabel = "Cancel",
  children,
}) => {
  const resolvedNameHtmlId = nameHtmlId ?? `${fieldName}-name`;
  return (
    <div
      role="group"
      aria-labelledby={editorLabelId}
      className={getItemPanelClassName(compact)}
    >
      <p
        id={editorLabelId}
        className="mb-3 text-xs uppercase tracking-wide text-gray-400"
      >
        {isEditing ? editorTitleEdit : editorTitleAdd}
      </p>

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Name */}
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor={resolvedNameHtmlId}
            className="text-xs uppercase tracking-wide text-gray-400"
          >
            {nameLabel}
          </label>
          <input
            id={resolvedNameHtmlId}
            ref={nameInputRef}
            type="text"
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            onKeyDown={onNameFieldKeyDown}
            placeholder={namePlaceholder}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 placeholder:text-gray-500 transition-colors duration-150 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          />
        </div>

        {/* Extra fields (e.g. description, badgeFor) */}
        {children}

        {/* Image upload */}
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-gray-400">
            {imageLabel}
          </label>
          <ImageUploader
            value={draftIcon}
            isUploading={isUploading}
            onChange={onDraftIconChange}
            onUploadStart={onUploadStart}
            onUploadEnd={onUploadEnd}
            onError={onUploadError}
            folder={folder}
          />
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            Preview
          </span>
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-700 bg-gray-900/60">
            {isUploading ? (
              <Loader2 size={16} className="animate-spin text-yellow-500" />
            ) : draftIcon ? (
              <CldImage
                src={draftIcon}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                alt="Preview"
              />
            ) : (
              <span className="text-[10px] text-gray-500">No Image</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isDraftValid || isUploading}
            aria-label={isEditing ? submitLabelEdit : submitLabelAdd}
            className="btn-info"
          >
            {isEditing ? submitLabelEdit : submitLabelAdd}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              aria-label={cancelLabel}
              className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-150 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 active:scale-95"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>

      {formError && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {formError}
        </p>
      )}
    </div>
  );
};

export default ItemEditorForm;