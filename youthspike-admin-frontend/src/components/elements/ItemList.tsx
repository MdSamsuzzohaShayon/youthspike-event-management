// components/common/ItemList.tsx
import { getItemPanelClassName } from "@/utils/item-helper";
import { type ReactNode } from "react";

interface ItemListProps<T> {
  items: T[];
  editingIndex: number | null;
  compact: boolean;
  listId: string;
  emptyTitle: string;
  emptyHint: string;
  /**
   * Render a single `<li>` for the item at `index`.
   * The wrapper handles the empty state and the surrounding `<ul>`.
   * The returned element must carry its own `key`.
   */
  renderItem: (item: T, isEditing: boolean, index: number) => ReactNode;
}

function ItemList<T>({
  items,
  editingIndex,
  compact,
  listId,
  emptyTitle,
  emptyHint,
  renderItem,
}: ItemListProps<T>) {
  return (
    <div id={listId} className={getItemPanelClassName(compact)}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
          <p className="text-sm text-gray-400">{emptyTitle}</p>
          <p className="text-xs text-gray-500">{emptyHint}</p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2" role="list">
          {items.map((item, index) =>
            renderItem(item, editingIndex === index, index),
          )}
        </ul>
      )}
    </div>
  );
}

export default ItemList;