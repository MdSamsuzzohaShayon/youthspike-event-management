// components/common/ItemListItem.tsx
import { Pencil, Trash2 } from "lucide-react";
import React, { type ReactNode } from "react";
import { CldImage } from "next-cloudinary";

interface ItemListItemProps {
  name: string;
  icon: string;
  isEditing: boolean;
  ariaEditLabel: string;
  ariaDeleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  /** Optional extra content rendered between name and action buttons (e.g. badgeFor). */
  children?: ReactNode;
}

const ItemListItem: React.FC<ItemListItemProps> = React.memo(
  ({
    name,
    icon,
    isEditing,
    ariaEditLabel,
    ariaDeleteLabel,
    onEdit,
    onDelete,
    children,
  }) => (
    <li
      className={`group flex items-center gap-3 rounded-md border bg-gray-900/60 pl-3 pr-2 py-2 shadow-sm transition-all duration-150 hover:border-yellow-500/60 hover:shadow-md ${
        isEditing ? "border-yellow-500 ring-1 ring-yellow-500/50" : "border-gray-700"
      }`}
    >
      <div className="h-8 w-8 flex-shrink-0 rounded-md overflow-hidden border border-gray-600">
        {icon ? (
          <CldImage
            src={icon}
            width={32}
            height={32}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <span className="text-[10px] text-gray-500">No image</span>
          </div>
        )}
      </div>

      <span className="text-sm text-gray-200 max-w-[10rem] truncate font-medium">
        {name}
      </span>

      {children}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label={ariaEditLabel}
          className="p-1.5 rounded text-gray-400 transition-colors duration-150 hover:bg-gray-700 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={ariaDeleteLabel}
          className="p-1.5 rounded text-gray-400 transition-colors duration-150 hover:bg-red-900/40 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  ),
);
ItemListItem.displayName = "ItemListItem";

export default ItemListItem;