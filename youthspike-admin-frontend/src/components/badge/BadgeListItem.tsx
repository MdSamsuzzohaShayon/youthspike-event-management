// ---------------------------------------------------------------------------
// BadgeListItem — a single row: icon, name, edit/delete actions.
// ---------------------------------------------------------------------------

import { TAddBadge } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import React from "react";
import BadgeIcon from "./BadgeIcon";

interface BadgeListItemProps {
    badge: TAddBadge;
    isEditing: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

const BadgeListItem: React.FC<BadgeListItemProps> = React.memo(
    ({ badge, isEditing, onEdit, onDelete }) => (
        <li
            className={`group flex items-center gap-3 rounded-md border bg-gray-900/60 pl-3 pr-2 py-2 shadow-sm transition-all duration-150 hover:border-yellow-500/60 hover:shadow-md ${isEditing
                    ? "border-yellow-500 ring-1 ring-yellow-500/50"
                    : "border-gray-700"
                }`}
        >
            <div className="h-8 w-8 flex-shrink-0 rounded-md overflow-hidden border border-gray-600">
                <BadgeIcon badge={badge} />
            </div>
            <span className="text-sm text-gray-200 max-w-[10rem] truncate font-medium">
                {badge.name}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label={`Edit ${badge.name} badge`}
                    className="p-1.5 rounded text-gray-400 transition-colors duration-150 hover:bg-gray-700 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={`Delete ${badge.name} badge`}
                    className="p-1.5 rounded text-gray-400 transition-colors duration-150 hover:bg-red-900/40 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </li>
    )
);
BadgeListItem.displayName = "BadgeListItem";


export default BadgeListItem;