import { Badge } from "src/badge/badge.schema";
import { EventBadgeInput, UpdateBadgeInput } from "./event.input";
import { Injectable } from "@nestjs/common";




interface IBadgeDiff {
    badgesIds: Set<string>;
    badgesInsert: EventBadgeInput[];
    badgesUpdate: UpdateBadgeInput[];
    badgesDelete: Set<string>;
}

@Injectable()
class EventHelpers {
    diffBadges(
        previousBadges: Badge[],
        updateBadges: UpdateBadgeInput[],
    ): IBadgeDiff {
        const badgesIds = new Set(previousBadges.map((b) => b._id));
        const badgesInsert: EventBadgeInput[] = [];
        const badgesUpdate: UpdateBadgeInput[] = [];
        const badgesDelete = new Set<string>();

        const { byName, byIcon } = this.createIndexes(previousBadges);

        for (const badge of updateBadges) {
            this.processBadge(
                badge,
                byName,
                byIcon,
                badgesInsert,
                badgesUpdate,
            );
        }

        this.collectDeletedBadges(
            previousBadges,
            updateBadges,
            badgesUpdate,
            badgesIds,
            badgesDelete,
        );

        return {
            badgesIds,
            badgesInsert,
            badgesUpdate,
            badgesDelete,
        };
    }

    private createIndexes(previousBadges: Badge[]) {
        const byName = new Map<string, Badge>();
        const byIcon = new Map<string, Badge>();

        for (const badge of previousBadges) {
            byName.set(badge.name, badge);
            byIcon.set(badge.icon, badge);
        }

        return { byName, byIcon };
    }

    private processBadge(
        badge: UpdateBadgeInput,
        byName: Map<string, Badge>,
        byIcon: Map<string, Badge>,
        inserts: EventBadgeInput[],
        updates: UpdateBadgeInput[],
    ) {
        const { name, icon } = badge;
        if (!name || !icon) {
            if (badge._id) {
                updates.push(badge);
            }
            return;
        }

        const match = byName.get(name) ?? byIcon.get(icon);

        if (!match) {
            inserts.push({ name, icon });
            return;
        }

        if (match.name === name && match.icon === icon) {
            return;
        }

        updates.push({
            ...badge,
            name,
            icon,
            _id: match._id,
        });
    }

    private collectDeletedBadges(
        previousBadges: Badge[],
        newBadges: UpdateBadgeInput[],
        updates: UpdateBadgeInput[],
        badgeIds: Set<string>,
        deletes: Set<string>,
    ) {
        const usedIds = new Set(updates.map((b) => b._id));

        const existing = new Set(
            newBadges
                .filter((b): b is UpdateBadgeInput & { name: string; icon: string } =>
                    !!b.name && !!b.icon,
                )
                .map((b) => this.key(b.name, b.icon)),
        );

        for (const badge of previousBadges) {
            if (
                usedIds.has(badge._id) ||
                existing.has(this.key(badge.name, badge.icon))
            ) {
                continue;
            }

            deletes.add(badge._id);
            badgeIds.delete(badge._id);
        }
    }

    private key(name: string, icon: string): string {
        return `${name}::${icon}`;
    }
}

export default EventHelpers;