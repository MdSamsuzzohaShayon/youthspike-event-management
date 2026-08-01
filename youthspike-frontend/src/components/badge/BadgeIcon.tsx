// ---------------------------------------------------------------------------
// BadgeIcon — renders a single badge's thumbnail (or nothing).
// ---------------------------------------------------------------------------

import { IBadge } from "@/types";

import { CldImage } from "next-cloudinary";
import React from "react";

const BadgeIcon: React.FC<{ badge: IBadge, className: string }> = React.memo(({ badge, className }) => {
    if (!badge.icon) return null;
    return (
        <img className={` ${className || "h-full w-full object-cover"}`} src={badge.icon} alt={badge.name} />
    );
});

export default BadgeIcon;