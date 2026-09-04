// ---------------------------------------------------------------------------
// BadgeIcon — renders a single badge's thumbnail (or nothing).
// ---------------------------------------------------------------------------

import { IBadge, TAddBadge } from "@/types";
import { getBadgePublicId } from "@/utils/badge/badge-helpers";
import { CldImage } from "next-cloudinary";
import React from "react";

const BadgeIcon: React.FC<{ badge: IBadge, className: string }> = React.memo(({ badge, className }) => {
    const publicId = getBadgePublicId(badge.icon);
    if (!publicId) return null;
    return (
        <img className={` ${className || "h-full w-full object-cover"}`} src={badge.icon} alt={badge.name} />
    );
});
BadgeIcon.displayName = "BadgeIcon";

export default BadgeIcon