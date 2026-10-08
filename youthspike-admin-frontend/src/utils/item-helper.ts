// utils/item/item-helpers.ts

/**
 * Generic helpers for "list-of-items-with-name-and-image" editors
 * used by both BadgeInput and SponsorInput.
 *
 * All functions are pure so they can be unit-tested in isolation.
 */

/** Normalize an item name for case-insensitive comparison and storage. */
export function normalizeItemName(name: string): string {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
  }
  
  /**
   * Build an O(1) lookup set of normalized item names.
   * Pass `excludeIndex` to skip the item currently being edited
   * (so editing an item and keeping its own name is not a duplicate).
   */
  export function buildItemNameSet<T>(
    items: T[],
    getName: (item: T) => string,
    excludeIndex: number | null = null,
  ): Set<string> {
    const names = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      if (i === excludeIndex) continue;
      names.add(normalizeItemName(getName(items[i])));
    }
    return names;
  }
  
  /** True if `name` (after normalization) is present in `existingNames`. */
  export function isItemNameTaken(existingNames: Set<string>, name: string): boolean {
    return existingNames.has(normalizeItemName(name));
  }
  
  /** Shared panel wrapper class used by both the list and the editor. */
  export function getItemPanelClassName(compact: boolean): string {
    return compact
      ? "rounded-md border border-gray-700 bg-gray-900/40 p-3"
      : "rounded-md border border-gray-700 bg-gray-900/40 p-4";
  }