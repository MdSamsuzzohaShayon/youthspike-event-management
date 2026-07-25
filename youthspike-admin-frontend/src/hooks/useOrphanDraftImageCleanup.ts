// ---------------------------------------------------------------------------
// Custom hook — encapsulates the "delete unsaved upload on unmount" rule.
// ---------------------------------------------------------------------------

import { TAddBadge } from "@/types";
import { getBadgePublicId, safelyDeleteDraftImage } from "@/utils/badge/badge-helpers";
import { useEffect, useRef } from "react";

/**
 * On unmount, deletes the current draft image from Cloudinary — but only if
 * it was never actually saved into `badges`. Uses refs so the effect itself
 * only runs once (mount/unmount), rather than re-firing (and deleting) on
 * every keystroke or successful save.
 *
 * Bug fixed: the previous version depended on `[draftIcon]`, so its cleanup
 * fired on *every* change — including the moment a badge was successfully
 * saved and the draft was reset — which could delete an image still in use
 * by a saved badge.
 */
function useOrphanDraftImageCleanup(draftIcon: string, badges: TAddBadge[]): void {
    const draftIconRef = useRef(draftIcon);
    const badgesRef = useRef(badges);

    useEffect(() => {
        draftIconRef.current = draftIcon;
    }, [draftIcon]);

    useEffect(() => {
        badgesRef.current = badges;
    }, [badges]);

    useEffect(() => {
        return () => {
            const orphanPublicId = draftIconRef.current;
            if (!orphanPublicId) return;

            const isStillReferencedByABadge = badgesRef.current.some(
                (badge) => getBadgePublicId(badge.icon) === orphanPublicId
            );
            if (!isStillReferencedByABadge) {
                void safelyDeleteDraftImage(orphanPublicId);
            }
        };
        // Intentionally empty — this must only run on true mount/unmount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}


export default useOrphanDraftImageCleanup;