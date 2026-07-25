// ---------------------------------------------------------------------------
// BadgeIcon — renders a single badge's thumbnail (or nothing).
// ---------------------------------------------------------------------------

import { TAddBadge } from "@/types";
import { getBadgePublicId } from "@/utils/badge/badge-helpers";
import { CldImage } from "next-cloudinary";
import React from "react";

const BadgeIcon: React.FC<{ badge: TAddBadge }> = React.memo(({ badge }) => {
    const publicId = getBadgePublicId(badge.icon);
    if (!publicId) return null;
    return (
        <CldImage
            src={publicId}
            alt={badge.name}
            width={32}
            height={32}
            className="h-full w-full object-cover"
        />
    );
});
BadgeIcon.displayName = "BadgeIcon";

export default BadgeIcon