
// ---------------------------------------------------------------------------
// Pure helpers — no React, no side effects, easy to unit test.
// ---------------------------------------------------------------------------

import { IBadge, TAddBadge } from "@/types";
import deleteDraftImage from "../request-handlers/deleteDraftImage";

// const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_BYTES = 1024 * 200; // 200kb
const CONTAINER_PADDING_COMPACT = "p-3";
const CONTAINER_PADDING_DEFAULT = "p-4";

/** Trims a badge name and collapses accidental double spaces. */
export function normalizeBadgeName(rawName: string): string {
    return rawName.trim().replace(/\s+/g, " ");
}

/** Extracts a usable Cloudinary public_id from a badge's icon field, if any. */
export function getBadgePublicId(icon: TAddBadge["icon"]): string {
    return typeof icon === "string" ? icon : "";
}

/**
 * Builds a lookup set of lowercased badge names, excluding one index
 * (used so edit-mode doesn't flag a badge as a duplicate of itself).
 * Building this once per `badges` change gives O(1) duplicate checks
 * instead of re-scanning the whole array on every keystroke.
 */
export function buildLowerCaseNameSet(
    badges: TAddBadge[],
    excludeIndex: number | null
): Set<string> {
    const names = new Set<string>();
    badges.forEach((badge, index) => {
        if (index !== excludeIndex) names.add(badge.name.toLowerCase());
    });
    return names;
}

export function isNameTaken(existingNames: Set<string>, candidateName: string): boolean {
    return existingNames.has(candidateName.toLowerCase());
}

export function isValidImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}

export function isFileTooLarge(file: File): boolean {
    return file.size > MAX_FILE_SIZE_BYTES;
}

export function getPanelClassName(compact: boolean): string {
    return `rounded-md border border-gray-700 bg-gray-800 ${compact ? CONTAINER_PADDING_COMPACT : CONTAINER_PADDING_DEFAULT
        }`;
}

/** Best-effort cleanup — a failed delete shouldn't surface as an app error. */
export async function safelyDeleteDraftImage(publicId: string): Promise<void> {
    try {
        await deleteDraftImage(publicId);
    } catch (error) {
        console.error("Failed to delete orphaned badge image:", publicId, error);
    }
}

// const badgeMap = useMemo(, [badges]);
export const createBadgeMap =(badges: IBadge[]): Map<string, IBadge>=>{
    const map = new Map<string, IBadge>();
    for (const badge of badges) {
      map.set(badge._id, badge);
    }
    return map;
  }