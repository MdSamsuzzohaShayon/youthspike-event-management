import EventHelpers from './event.helpers';
import { Badge, EBadgeFor } from 'src/badge/badge.schema';
import { EventBadgeInput, UpdateBadgeInput } from './event.input';

describe('EventHelpers — diffBadges', () => {
  let helpers: EventHelpers;

  beforeEach(() => {
    helpers = new EventHelpers();
  });

  /** Helper to build a Badge with all required fields */
  const makeBadge = (overrides: Partial<Badge> = {}): Badge => ({
    _id: 'badge-id-1' as any,
    name: 'MVP',
    icon: 'star',
    badgeFor: EBadgeFor.PLAYER,
    description: 'Most Valuable Player',
    event: 'event-id-1',
    teams: [],
    players: [],
    ...overrides,
  });

  /** Helper to build an UpdateBadgeInput */
  const makeUpdate = (overrides: Partial<any> = {}): UpdateBadgeInput => ({
    name: 'MVP',
    icon: 'star',
    badgeFor: 'PLAYER' as any,
    description: 'Most Valuable Player',
    ...overrides,
  });

  // ─── Empty inputs ──────────────────────────────────────────────
  describe('empty inputs', () => {
    it('returns all empty when both previous and update are empty', () => {
      const result = helpers.diffBadges([], []);
      expect(result.badgesIds.size).toBe(0);
      expect(result.badgesInsert).toHaveLength(0);
      expect(result.badgesUpdate).toHaveLength(0);
      expect(result.badgesDelete.size).toBe(0);
    });

    it('deletes all previous badges when update is empty', () => {
      const previous = [makeBadge({ _id: 'b1' }), makeBadge({ _id: 'b2', name: 'Rookie', icon: 'medal' })];
      const result = helpers.diffBadges(previous, []);
      expect(result.badgesDelete.size).toBe(2);
      expect(result.badgesIds.size).toBe(0);
    });

    it('inserts all update badges when previous is empty', () => {
      const updates = [makeUpdate({ name: 'A', icon: 'a' }), makeUpdate({ name: 'B', icon: 'b' })];
      const result = helpers.diffBadges([], updates);
      expect(result.badgesInsert).toHaveLength(2);
      expect(result.badgesUpdate).toHaveLength(0);
      expect(result.badgesDelete.size).toBe(0);
    });
  });

  // ─── Exact matches ─────────────────────────────────────────────
  describe('exact matches (no change)', () => {
    it('skips badge when all fields match exactly', () => {
      const previous = [makeBadge({ _id: 'b1' })];
      const updates = [makeUpdate()];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesInsert).toHaveLength(0);
      expect(result.badgesUpdate).toHaveLength(0);
      expect(result.badgesDelete.size).toBe(0);
      expect(result.badgesIds.has('b1')).toBe(true);
    });
  });

  // ─── Updates ──────────────────────────────────────────────────
  describe('updates (partial match)', () => {
    it('flags as update when description differs but name+icon match', () => {
      const previous = [makeBadge({ _id: 'b1', description: 'Old desc' })];
      const updates = [makeUpdate({ description: 'New desc' })];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesUpdate).toHaveLength(1);
      expect(result.badgesUpdate[0]._id).toBe('b1');
      expect(result.badgesInsert).toHaveLength(0);
      expect(result.badgesDelete.size).toBe(0);
    });

    it('flags as update when icon differs but name matches', () => {
      const previous = [makeBadge({ _id: 'b1', icon: 'star' })];
      const updates = [makeUpdate({ icon: 'trophy' })];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesUpdate).toHaveLength(1);
      expect(result.badgesUpdate[0]._id).toBe('b1');
    });

    it('flags as update when name differs but icon matches', () => {
      const previous = [makeBadge({ _id: 'b1', name: 'MVP' })];
      const updates = [makeUpdate({ name: 'Champion' })];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesUpdate).toHaveLength(1);
      expect(result.badgesUpdate[0]._id).toBe('b1');
    });

    it('updates badge with _id only (missing required fields)', () => {
      const previous = [makeBadge({ _id: 'b1' })];
      const updates: any[] = [{ _id: 'b1' }]; // only _id, no name/icon/etc
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesUpdate).toHaveLength(1);
      expect(result.badgesUpdate[0]._id).toBe('b1');
    });
  });

  // ─── Inserts ───────────────────────────────────────────────────
  describe('inserts (new badges)', () => {
    it('inserts badge when no name or icon match exists', () => {
      const previous = [makeBadge({ _id: 'b1', name: 'MVP', icon: 'star' })];
      const updates = [makeUpdate({ name: 'Rookie', icon: 'medal' })];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesInsert).toHaveLength(1);
      expect(result.badgesInsert[0].name).toBe('Rookie');
      expect(result.badgesInsert[0].icon).toBe('medal');
      // Previous badge not in updates → deleted
      expect(result.badgesDelete.size).toBe(1);
      expect(result.badgesDelete.has('b1')).toBe(true);
    });
  });

  // ─── Deletes ───────────────────────────────────────────────────
  describe('deletes (removed badges)', () => {
    it('deletes previous badge not present in updates', () => {
      const previous = [
        makeBadge({ _id: 'b1', name: 'MVP', icon: 'star' }),
        makeBadge({ _id: 'b2', name: 'Rookie', icon: 'medal' }),
      ];
      const updates = [makeUpdate({ name: 'MVP', icon: 'star' })]; // only b1's badge
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesDelete.has('b2')).toBe(true);
      expect(result.badgesIds.has('b2')).toBe(false);
      expect(result.badgesIds.has('b1')).toBe(true);
    });

    it('does NOT delete previous badge when name+icon match an update badge', () => {
      const previous = [makeBadge({ _id: 'b1', name: 'MVP', icon: 'star' })];
      const updates = [makeUpdate({ name: 'MVP', icon: 'star', description: 'Changed' })];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesDelete.size).toBe(0);
    });
  });

  // ─── Complex scenarios ─────────────────────────────────────────
  describe('complex mixed scenario', () => {
    it('handles insert + update + delete simultaneously', () => {
      const previous = [
        makeBadge({ _id: 'b1', name: 'MVP', icon: 'star', description: 'Old' }),
        makeBadge({ _id: 'b2', name: 'Rookie', icon: 'medal', description: 'Rookie desc' }),
        makeBadge({ _id: 'b3', name: 'Captain', icon: 'shield', description: 'Captain desc' }),
      ];
      const updates: UpdateBadgeInput[] = [
        makeUpdate({ name: 'MVP', icon: 'star', description: 'New desc' }), // update b1
        makeUpdate({ name: 'Rookie', icon: 'medal', description: 'Rookie desc' }), // exact match b2 → no change
        makeUpdate({ name: 'AllStar', icon: 'crown', description: 'AllStar desc' }), // new insert
        // b3 (Captain/shield) is NOT in updates → delete
      ];
      const result = helpers.diffBadges(previous, updates);

      expect(result.badgesInsert).toHaveLength(1);
      expect(result.badgesInsert[0].name).toBe('AllStar');

      expect(result.badgesUpdate).toHaveLength(1);
      expect(result.badgesUpdate[0]._id).toBe('b1');

      expect(result.badgesDelete.has('b3')).toBe(true);
      expect(result.badgesDelete.size).toBe(1);

      expect(result.badgesIds.has('b1')).toBe(true);
      expect(result.badgesIds.has('b2')).toBe(true);
      expect(result.badgesIds.has('b3')).toBe(false);
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles badge with same name AND same icon as another previous badge', () => {
      const previous = [
        makeBadge({ _id: 'b1', name: 'MVP', icon: 'star' }),
        makeBadge({ _id: 'b2', name: 'MVP', icon: 'star' }), // duplicate name+icon
      ];
      const updates = [makeUpdate({ name: 'MVP', icon: 'star' })];
      const result = helpers.diffBadges(previous, updates);

      // byName has 'MVP' → b2 (last one wins in map.set)
      // Match found → exact match → skip
      // Collect deletes: b1 not in usedIds, but b1.name+b1.icon = 'MVP::star' which IS in existing → skip
      // b2 not in usedIds, b2.name+b2.icon = 'MVP::star' → in existing → skip
      expect(result.badgesInsert).toHaveLength(0);
      expect(result.badgesUpdate).toHaveLength(0);
      // Neither b1 nor b2 is deleted because their name+icon key matches
      expect(result.badgesDelete.size).toBe(0);
    });

    it('handles UpdateBadgeInput with only _id and no other fields', () => {
      const previous = [makeBadge({ _id: 'b1' })];
      const updates: any[] = [{ _id: 'b1' }];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesUpdate).toHaveLength(1);
      expect(result.badgesDelete.size).toBe(0);
    });

    it('preserves badgeIds for badges that are exact matches', () => {
      const previous = [makeBadge({ _id: 'b1' }), makeBadge({ _id: 'b2', name: 'Rookie', icon: 'medal' })];
      const updates = [
        makeUpdate({ name: 'MVP', icon: 'star' }), // exact match b1
        makeUpdate({ name: 'Rookie', icon: 'medal' }), // exact match b2
      ];
      const result = helpers.diffBadges(previous, updates);
      expect(result.badgesIds.size).toBe(2);
      expect(result.badgesIds.has('b1')).toBe(true);
      expect(result.badgesIds.has('b2')).toBe(true);
    });
  });
});