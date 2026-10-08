// hooks/useItemEditor.ts
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type KeyboardEvent,
    type RefObject,
    type SetStateAction,
  } from "react";
  import {
    buildItemNameSet,
    isItemNameTaken,
    normalizeItemName,
  } from "../utils/item-helper";
  
  export interface ItemDraft {
    name: string;
    icon: string;
  }
  
  export interface UseItemEditorOptions<T> {
    items: T[];
    onChange: (items: T[]) => void;
    /** Extract the user-visible name from an item. */
    getName: (item: T) => string;
    /** Extract the icon (Cloudinary public_id) from an item. */
    getIcon: (item: T) => string;
    /**
     * Build a new item from the current draft. The consumer may close over
     * extra local state (e.g. description, badgeFor). The hook re-creates its
     * callbacks on every render so the latest closure is used.
     */
    buildItem: (draft: ItemDraft) => T;
    /** Called after a successful submit or a cancel — let the consumer reset its own extra state. */
    onReset?: () => void;
    missingFieldsError?: string;
    duplicateNameError?: string;
  }
  
  export interface UseItemEditorResult {
    // Draft state
    draftName: string;
    draftIcon: string;
    editingIndex: number | null;
    isEditing: boolean;
    isUploading: boolean;
    isDraftValid: boolean;
    formError: string | null;
    nameInputRef: RefObject<HTMLInputElement | null>;
    existingNames: Set<string>;
  
    // Setters
    setDraftName: Dispatch<SetStateAction<string>>;
    setDraftIcon: Dispatch<SetStateAction<string>>;
    setIsUploading: Dispatch<SetStateAction<boolean>>;
    setFormError: Dispatch<SetStateAction<string | null>>;
  
    // Upload handlers (stable references for ImageUploader)
    handleUploadStart: () => void;
    handleUploadEnd: () => void;
  
    // Core actions
    handleSubmit: () => void;
    handleEdit: (index: number) => void;
    handleDelete: (index: number) => void;
    handleCancel: () => void;
    resetEditor: () => void;
    focusNameInput: () => void;
  
    // Keyboard: Enter to submit, Escape to cancel. Generic — usable on any input in the editor.
    handleFieldKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  }
  
  /**
   * Generic state + handlers for a "list of items with name + image" editor.
   * Powers BadgeInput and SponsorInput so they share UX and keyboard behaviour.
   */
  export function useItemEditor<T>({
    items,
    onChange,
    getName,
    getIcon,
    buildItem,
    onReset,
    missingFieldsError = "Name and image are both required.",
    duplicateNameError = "An item with this name already exists.",
  }: UseItemEditorOptions<T>): UseItemEditorResult {
    const [draftName, setDraftName] = useState<string>("");
    const [draftIcon, setDraftIcon] = useState<string>("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const nameInputRef = useRef<HTMLInputElement | null>(null);
  
    // Ref so resetEditor can call the latest onReset without re-creating itself.
    const onResetRef = useRef(onReset);
    onResetRef.current = onReset;
  
    const isEditing = editingIndex !== null;
    const normalizedDraftName = useMemo(
      () => normalizeItemName(draftName),
      [draftName],
    );
  
    // O(1) duplicate lookup — only rebuilt when items or editingIndex change.
    const existingNames = useMemo(
      () => buildItemNameSet(items, getName, editingIndex),
      [items, getName, editingIndex],
    );
  
    const isDraftValid = useMemo(() => {
      if (!normalizedDraftName || !draftIcon) return false;
      return !isItemNameTaken(existingNames, normalizedDraftName);
    }, [normalizedDraftName, draftIcon, existingNames]);
  
    const resetEditor = useCallback(() => {
      setDraftName("");
      setDraftIcon("");
      setEditingIndex(null);
      setFormError(null);
      onResetRef.current?.();
    }, []);
  
    const focusNameInput = useCallback(() => {
      requestAnimationFrame(() => nameInputRef.current?.focus());
    }, []);
  
    const handleSubmit = useCallback(() => {
      if (!normalizedDraftName || !draftIcon) {
        setFormError(missingFieldsError);
        return;
      }
      if (isItemNameTaken(existingNames, normalizedDraftName)) {
        setFormError(duplicateNameError);
        return;
      }
  
      const nextItem = buildItem({ name: draftName, icon: draftIcon });
      const updatedItems =
        isEditing && editingIndex !== null
          ? items.map((item, index) => (index === editingIndex ? nextItem : item))
          : [...items, nextItem];
  
      onChange(updatedItems);
      resetEditor();
      focusNameInput();
    }, [
      normalizedDraftName,
      draftName,
      draftIcon,
      existingNames,
      isEditing,
      editingIndex,
      items,
      onChange,
      buildItem,
      resetEditor,
      focusNameInput,
      missingFieldsError,
      duplicateNameError,
    ]);
  
    const handleEdit = useCallback(
      (index: number) => {
        const item = items[index];
        if (!item) return;
        setDraftName(getName(item));
        setDraftIcon(getIcon(item));
        setEditingIndex(index);
        setFormError(null);
        focusNameInput();
      },
      [items, getName, getIcon, focusNameInput],
    );
  
    const handleDelete = useCallback(
      (index: number) => {
        const exists = items[index];
        if (!exists) return;
        onChange(items.filter((_, i) => i !== index));
        if (editingIndex === index) {
          resetEditor();
        }
      },
      [items, onChange, editingIndex, resetEditor],
    );
  
    const handleCancel = useCallback(() => {
      resetEditor();
      focusNameInput();
    }, [resetEditor, focusNameInput]);
  
    const handleFieldKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleSubmit();
        } else if (event.key === "Escape" && isEditing) {
          event.preventDefault();
          handleCancel();
        }
      },
      [handleSubmit, handleCancel, isEditing],
    );
  
    const handleUploadStart = useCallback(() => setIsUploading(true), []);
    const handleUploadEnd = useCallback(() => setIsUploading(false), []);
  
    // Clear stale validation error as soon as the draft becomes valid again.
    useEffect(() => {
      if (isDraftValid && formError) setFormError(null);
    }, [isDraftValid, formError]);
  
    return {
      draftName,
      draftIcon,
      editingIndex,
      isEditing,
      isUploading,
      isDraftValid,
      formError,
      nameInputRef,
      existingNames,
      setDraftName,
      setDraftIcon,
      setIsUploading,
      setFormError,
      handleUploadStart,
      handleUploadEnd,
      handleSubmit,
      handleEdit,
      handleDelete,
      handleCancel,
      resetEditor,
      focusNameInput,
      handleFieldKeyDown,
    };
  }