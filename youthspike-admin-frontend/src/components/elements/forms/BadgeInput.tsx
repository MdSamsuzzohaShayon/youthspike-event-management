import {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type KeyboardEvent,
} from "react";
import type { TAddBadge } from "@/types";
import useOrphanDraftImageCleanup from "@/hooks/useOrphanDraftImageCleanup";
import { buildLowerCaseNameSet, getBadgePublicId, isNameTaken, normalizeBadgeName } from "@/utils/badge/badge-helpers";
import BadgeList from "@/components/badge/BadgeList";
import BadgeEditorForm from "@/components/badge/BadgeEditorForm";
import deleteDraftImage from "@/utils/request-handlers/deleteDraftImage";

export interface BadgeInputProps {
  name: string;
  label?: string;
  className?: string;
  /** Renders a tighter, lower-padding variant of the editor. */
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
  const [draftName, setDraftName] = useState<string>("");
  const [draftDescription, setDraftDescription] = useState<string>("");

  const [draftIcon, setDraftIcon] = useState<string>(""); // Cloudinary public_id
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingIndex !== null;
  const normalizedDraftName = useMemo(() => normalizeBadgeName(draftName), [draftName]);

  // O(1) duplicate lookups instead of re-scanning `badges` on every keystroke.
  const existingLowerCaseNames = useMemo(
    () => buildLowerCaseNameSet(badges, editingIndex),
    [badges, editingIndex]
  );

  const isDraftValid = useMemo(() => {
    if (!normalizedDraftName || !draftIcon || !draftDescription) return false;
    return !isNameTaken(existingLowerCaseNames, normalizedDraftName);
  }, [normalizedDraftName, draftIcon, draftDescription, existingLowerCaseNames]);

  useOrphanDraftImageCleanup(draftIcon, badges);

  const resetEditor = useCallback(() => {
    setDraftName("");
    setDraftDescription("");
    setDraftIcon("");
    setEditingIndex(null);
    setFormError(null);
  }, []);

  const focusNameInput = useCallback(() => {
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }, []);

  const handleSubmitBadge = useCallback(() => {
    if (!normalizedDraftName || !draftIcon || !draftDescription) {
      setFormError("Badge name, description, and image are both required.");
      return;
    }
    if (isNameTaken(existingLowerCaseNames, normalizedDraftName)) {
      setFormError("A badge with this name already exists.");
      return;
    }

    const nextBadge: TAddBadge = { name: normalizedDraftName, description: draftDescription, icon: draftIcon };
    const updatedBadges =
      isEditing && editingIndex !== null
        ? badges.map((badge, index) => (index === editingIndex ? nextBadge : badge))
        : [...badges, nextBadge];

    onChange(updatedBadges);
    resetEditor();
    focusNameInput();
  }, [
    normalizedDraftName,
    draftDescription,
    draftIcon,
    existingLowerCaseNames,
    isEditing,
    editingIndex,
    badges,
    onChange,
    resetEditor,
    focusNameInput,
  ]);

  const handleEditBadge = useCallback(
    (index: number) => {
      const badge = badges[index];
      if (!badge) return;
      setDraftName(badge.name);
      setDraftDescription(badge.description);
      // Only reuse the icon if it's already a Cloudinary public_id.
      // If it's somehow still a raw File, force a re-upload.
      setDraftIcon(getBadgePublicId(badge.icon));
      setEditingIndex(index);
      setFormError(null);
      focusNameInput();
    },
    [badges, focusNameInput]
  );

  const handleDeleteBadge = useCallback(
    async (index: number) => {
      const badgeToDelete = badges.find((_, i)=> i === index);
      if(!badgeToDelete) return;
      // This function is not deleting image unnecessary therefore, I have disabled it for now
      // await deleteDraftImage(badgeToDelete.icon); // temp
      onChange(badges.filter((_, i) => i !== index));
      if (editingIndex === index) {
        resetEditor();
      }
    },
    [badges, onChange, editingIndex, resetEditor]
  );

  const handleCancelEdit = useCallback(() => {
    resetEditor();
    focusNameInput();
  }, [resetEditor, focusNameInput]);

  const handleNameFieldKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmitBadge();
      } else if (event.key === "Escape" && isEditing) {
        event.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSubmitBadge, handleCancelEdit, isEditing]
  );

  const handleDescriptionFieldKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmitBadge();
      } else if (event.key === "Escape" && isEditing) {
        event.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSubmitBadge, handleCancelEdit, isEditing]
  );

  // Clear any stale validation message once the draft becomes valid again.
  useEffect(() => {
    if (isDraftValid && formError) setFormError(null);
  }, [isDraftValid, formError]);

  const handleUploadStart = useCallback(() => setIsUploading(true), []);
  const handleUploadEnd = useCallback(() => setIsUploading(false), []);

  const editorLabelId = `${fieldName}-editor-label`;
  const listId = `${fieldName}-badge-list`;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {label && (
        <label
          htmlFor={`${fieldName}-badge-name`}
          className="text-sm uppercase tracking-wide text-gray-300 font-medium"
        >
          {label}
          {required && <span className="text-yellow-500 ml-1">*</span>}
        </label>
      )}

      <BadgeList
        badges={badges}
        editingIndex={editingIndex}
        compact={compact}
        listId={listId}
        onEditBadge={handleEditBadge}
        onDeleteBadge={handleDeleteBadge}
      />

      <BadgeEditorForm
        fieldName={fieldName}
        editorLabelId={editorLabelId}
        compact={compact}
        isEditing={isEditing}
        isUploading={isUploading}
        isDraftValid={isDraftValid}
        draftName={draftName}
        draftDescription={draftDescription}
        draftIcon={draftIcon}
        formError={formError}
        folder={folder}
        nameInputRef={nameInputRef}
        onDraftNameChange={setDraftName}
        onDraftDescriptionChange={setDraftDescription}
        onNameFieldKeyDown={handleNameFieldKeyDown}
        onDescriptionFieldKeyDown={handleDescriptionFieldKeyDown}
        onDraftIconChange={setDraftIcon}
        onUploadStart={handleUploadStart}
        onUploadEnd={handleUploadEnd}
        onUploadError={setFormError}
        onSubmit={handleSubmitBadge}
        onCancel={handleCancelEdit}
      />

      <p className="text-xs text-gray-500">
        Upload an image and give the badge a unique name, then add it to the list above.
        Supported formats: PNG, JPEG, GIF, WebP (max 5MB).
      </p>

      {/* Hidden input for form integration */}
      <input type="hidden" name={fieldName} value={JSON.stringify(badges)} />
    </div>
  );
}