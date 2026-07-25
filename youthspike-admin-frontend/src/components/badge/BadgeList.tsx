// ---------------------------------------------------------------------------
// BadgeList — the "existing badges" panel.
// ---------------------------------------------------------------------------

import { TAddBadge } from "@/types";
import { getPanelClassName } from "@/utils/badge/badge-helpers";
import BadgeListItem from "./BadgeListItem";

interface BadgeListProps {
    badges: TAddBadge[];
    editingIndex: number | null;
    compact: boolean;
    listId: string;
    onEditBadge: (index: number) => void;
    onDeleteBadge: (index: number) => void;
}

const BadgeList: React.FC<BadgeListProps> = ({
    badges,
    editingIndex,
    compact,
    listId,
    onEditBadge,
    onDeleteBadge,
}) => (
    <div id={listId} className={getPanelClassName(compact)}>
        {badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
                <p className="text-sm text-gray-400">No badges added yet.</p>
                <p className="text-xs text-gray-500">Create your first badge below.</p>
            </div>
        ) : (
            <ul className="flex flex-wrap gap-2" role="list">
                {badges.map((badge, index) => (
                    <BadgeListItem
                        key={`${badge.name}-${index}`}
                        badge={badge}
                        isEditing={editingIndex === index}
                        onEdit={() => onEditBadge(index)}
                        onDelete={() => onDeleteBadge(index)}
                    />
                ))}
            </ul>
        )}
    </div>
);


export default BadgeList;