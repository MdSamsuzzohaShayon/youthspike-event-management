// hooks/useOrphanDraftImageCleanup.ts
import { useEffect, useRef } from "react";
import deleteDraftImage from "@/utils/request-handlers/deleteDraftImage";

/**
 * Cleans up "orphan" draft images that were uploaded to Cloudinary but
 * never attached to a persisted item.
 *
 * Two scenarios:
 *  1. The draft icon changes (user picks a new image): the previous draft
 *     is deleted if no persisted item uses it.
 *  2. The component unmounts: the current draft is deleted if no persisted
 *     item uses it.
 *
 * Refs are used so the unmount cleanup always sees the latest values
 * without re-running the effect on every render.
 */
export function useOrphanDraftImageCleanup<T>(
  draftIcon: string,
  items: T[],
  getIcon: (item: T) => string,
): void {
  const prevDraftIconRef = useRef<string>(draftIcon);
  const itemsRef = useRef(items);
  const getIconRef = useRef(getIcon);

  itemsRef.current = items;
  getIconRef.current = getIcon;

  // Scenario 1: draft icon changed.
  useEffect(() => {
    const prevIcon = prevDraftIconRef.current;
    if (prevIcon && prevIcon !== draftIcon) {
      const usedIcons = new Set(
        itemsRef.current.map((item) => getIconRef.current(item)),
      );
      if (!usedIcons.has(prevIcon)) {
        void deleteDraftImage(prevIcon);
      }
    }
    prevDraftIconRef.current = draftIcon;
  }, [draftIcon]);

  // Scenario 2: unmount.
  useEffect(() => {
    return () => {
      const currentDraft = prevDraftIconRef.current;
      if (!currentDraft) return;
      const usedIcons = new Set(
        itemsRef.current.map((item) => getIconRef.current(item)),
      );
      if (!usedIcons.has(currentDraft)) {
        void deleteDraftImage(currentDraft);
      }
    };
    // Intentionally empty — only run on mount/unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useOrphanDraftImageCleanup;