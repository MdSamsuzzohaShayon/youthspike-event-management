import { IBadge } from "@/types";

export const createBadgeMap = (badges: IBadge[]) => {
    const map = new Map<string, IBadge>();
    for (const badge of badges) {
        map.set(badge._id, badge);
    }
    return map;
}