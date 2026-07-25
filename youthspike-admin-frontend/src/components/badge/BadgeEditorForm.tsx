
// ---------------------------------------------------------------------------
// BadgeEditorForm — the "add / edit a badge" panel.
// ---------------------------------------------------------------------------

import { getPanelClassName } from "@/utils/badge/badge-helpers";
import { KeyboardEvent, RefObject } from "react";
import ImageUploader from "../elements/forms/ImageUploader";
import { Loader2 } from "lucide-react";
import { CldImage } from "next-cloudinary";

interface BadgeEditorFormProps {
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
    onDraftNameChange: (value: string) => void;
    onNameFieldKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onDraftIconChange: (publicId: string) => void;
    onUploadStart: () => void;
    onUploadEnd: () => void;
    onUploadError: (message: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

const BadgeEditorForm: React.FC<BadgeEditorFormProps> = ({
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
    onDraftNameChange,
    onNameFieldKeyDown,
    onDraftIconChange,
    onUploadStart,
    onUploadEnd,
    onUploadError,
    onSubmit,
    onCancel,
}) => (
    <div role="group" aria-labelledby={editorLabelId} className={getPanelClassName(compact)}>
        <p id={editorLabelId} className="mb-3 text-xs uppercase tracking-wide text-gray-400">
            {isEditing ? "Edit badge" : "Add a badge"}
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Badge name */}
            <div className="flex flex-1 flex-col gap-1">
                <label
                    htmlFor={`${fieldName}-badge-name`}
                    className="text-xs uppercase tracking-wide text-gray-400"
                >
                    Badge Name
                </label>
                <input
                    id={`${fieldName}-badge-name`}
                    ref={nameInputRef}
                    type="text"
                    value={draftName}
                    onChange={(event) => onDraftNameChange(event.target.value)}
                    onKeyDown={onNameFieldKeyDown}
                    placeholder="e.g. Champion"
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 placeholder:text-gray-500 transition-colors duration-150 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                />
            </div>

            {/* Image upload */}
            <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">Badge Image</label>
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
                <span className="text-xs uppercase tracking-wide text-gray-400">Preview</span>
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
                    aria-label={isEditing ? "Update badge" : "Add badge"}
                    className="btn-info"
                >
                    {isEditing ? "Update Badge" : "Add Badge"}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Cancel editing badge"
                        className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-150 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 active:scale-95"
                    >
                        Cancel
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


export default BadgeEditorForm;