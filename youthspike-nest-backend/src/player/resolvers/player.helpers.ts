import { EventService } from "src/event/event.service";
import { PlayerResponse } from "./player.response";
import { TeamService } from "src/team/team.service";
import { MatchService } from "src/match/match.service";
import { CloudinaryService } from "src/shared/services/cloudinary.service";
import { PlayerService } from "../player.service";
import { UserService } from "src/user/user.service";
import { PlayerRankingService } from "src/player-ranking/player-ranking.service";
import { AppResponse } from "src/shared/response";
import { HttpStatus, Injectable } from "@nestjs/common";
import { EPlayerStatus, Player } from "../player.schema";
import { User } from "src/user/user.schema";
import { UpdateQuery } from "mongoose";
import { PlayerRanking, PlayerRankingItem } from "src/player-ranking/player-ranking.schema";
import { Team } from "src/team/team.schema";
import * as bcrypt from 'bcrypt';
import { CreatePlayerBody, CreatePlayerInput, UpdatePlayerBody } from "./player.input";
import { Match } from "src/match/match.schema";
import { FileUpload } from "graphql-upload/processRequest.mjs";

@Injectable()
export default class PlayerHelper {

    constructor(
        private eventService: EventService,
        private teamService: TeamService,
        private matchService: MatchService,
        private cloudinaryService: CloudinaryService,
        private playerService: PlayerService,
        private userService: UserService,
        private playerRankingService: PlayerRankingService,
    ) { }


  // ─── Pure helpers (no I/O, easy to unit test) ────────────────────────────────
buildPlayerFullName(firstName: string, lastName: string): string {
  return `${firstName}_${lastName}`;
}

removeEmptyStringFields<T extends object>(
  doc: T,
  fields: (keyof T)[],
): T {
  const result = { ...doc };
  for (const field of fields) {
    if (result[field] === '') delete result[field];
  }
  return result;
}

/**
 * Given the players who should be in a ranking and the ranking items that
 * already exist, returns only the ranking items that need to be inserted
 * for players who aren't ranked yet.
 * O(n) via Set lookup instead of O(n * m) via Array.find inside a loop.
 */
buildMissingRankingItems(
  playerIdsInTeam: string[],
  existingItems: PlayerRankingItem[],
  playerRankingId: string,
): PlayerRankingItem[] {
  const alreadyRankedPlayerIds = new Set(
    existingItems.map((item) => item.player?.toString()).filter(Boolean),
  );
  const highestRank = existingItems.length === 0
    ? 0
    : Math.max(...existingItems.map((item) => item.rank));

  const missingItems: PlayerRankingItem[] = [];
  let increment = 0;
  for (const rawId of playerIdsInTeam) {
    const playerId = rawId.toString();
    if (!alreadyRankedPlayerIds.has(playerId)) {
      increment += 1;
      missingItems.push({ player: playerId, rank: highestRank + increment, playerRanking: playerRankingId });
    }
  }
  return missingItems;
}


  // ── createPlayer helpers ──────────────────────────────────────────────

  /** Builds the document to persist: uploads the profile image, derives the
   *  username fallback, and strips empty-string optional fields. */
  async buildNewPlayerDocument(
    input: CreatePlayerInput,
    profile: Promise<FileUpload>,
    name: string,
  ): Promise<CreatePlayerInput> {
    const profileUrl = profile ? await this.cloudinaryService.uploadFiles(profile) : null;

    const username = input.username?.trim()
      ? input.username
      : this.playerService.playerUsername(input.firstName);

    const document: CreatePlayerInput & {profile: string, name: string} = {
      ...input,
      profile: profileUrl as string,
      name,
      username,
    };

    return this.removeEmptyStringFields(document, ['email', 'phone']);
  }

  /** Adds the new player to each team's roster and rebuilds any open
   *  (non-locked) player rankings for that team. Teams are processed in
   *  parallel since they're independent of one another. */
  async assignPlayerToTeams(newPlayerId: string, teamIds: string[]): Promise<void> {
    const teams = await this.teamService.find({ _id: { $in: teamIds } });

    await Promise.all(
      teams.map(async (team) => {
        await this.updateTeamPlayerRankings(team, newPlayerId);
        // BUG FIX: was `{ _id: team }` (the whole team object) — now the id.
        await this.teamService.updateOne(
          { _id: team._id },
          { $addToSet: { players: newPlayerId } },
        );
      }),
    );
  }

  /** Rebuilds every open ranking for a single team so the new player is
   *  represented, without disturbing existing rank order. */
  private async updateTeamPlayerRankings(team: Team, newPlayerId: string): Promise<void> {
    const openRankings = await this.playerRankingService.find({ team: team._id, rankLock: false });
    if (!openRankings?.length) return;

    const playerIdsInTeam = [...team.players, newPlayerId].map(String);

    await Promise.all(
      openRankings
        .filter((ranking) => !(ranking.rankLock && ranking.match))
        .map(async (ranking) => {
          const existingItems = await this.playerRankingService.findItems({ playerRanking: ranking._id });
          const itemsToInsert = this.buildMissingRankingItems(playerIdsInTeam, existingItems, String(ranking._id));
          if (itemsToInsert.length === 0) return;

          const insertedItems = await this.playerRankingService.insertManyItems(itemsToInsert);
          await this.playerRankingService.updateOne(
            { _id: ranking._id },
            { $addToSet: { rankings: { $each: insertedItems.map((item) => item._id) } } },
          );
        }),
    );
  }


  // ─── handleTeamUpdate ─────────────────────────────────────────────────────────

  public async removePlayerFromPreviousTeam(
    playerId: string,
    prevTeamId: string,
    playerObj: Player,
    input: UpdateQuery<Player>,
    updatePromises: Promise<unknown>[],
  ): Promise<void> {
    // 1. Pull player from the old team document.
    updatePromises.push(
      this.teamService.updateOne(
        { _id: prevTeamId },
        { $pull: { players: playerId }, $addToSet: { moved: playerId } },
      ),
    );

    // 2. Remove the player's ranking items from every unlocked ranking in the old team.
    await this.removePlayerFromRankings([prevTeamId], playerId);

    // 3. Strip old team from player's team list; record it as a previous team.
    const existingTeamIds: string[] = Array.isArray(playerObj.teams)
      ? playerObj.teams.map((t) => t.toString())
      : [];

    input.teams = existingTeamIds.filter((id) => id !== prevTeamId);
    input.$addToSet = { prevteams: prevTeamId };
  }


  public async removeCaptainRoles(
    playerId: string,
    playerObj: Player,
  ): Promise<void> {
    const captainTeamIds = playerObj.captainofteams?.map((t) => t?.toString()) ?? [];
    const coCaptainTeamIds = playerObj.cocaptainofteams?.map((cc) => cc?.toString()) ?? [];

    const ops: Promise<unknown>[] = [];

    if (captainTeamIds.length > 0) {
      ops.push(
        this.teamService.updateMany(
          { _id: { $in: captainTeamIds } },
          { $set: { captain: null } },
        ),
        this.playerService.updateOne(
          { _id: playerId },
          { $pull: { captainofteams: { $in: playerObj.captainofteams } } },
        ),
      );
    }

    if (coCaptainTeamIds.length > 0) {
      ops.push(
        this.teamService.updateMany(
          { _id: { $in: coCaptainTeamIds } },
          { $set: { cocaptain: null } },
        ),
        this.playerService.updateOne(
          { _id: playerId },
          { $pull: { cocaptainofteams: { $in: playerObj.cocaptainofteams } } },
        ),
      );
    }

    await Promise.all(ops);
  }

  public async addPlayerToRankings(teamIds: string[], playerId: string) {

    const newTeamRankings = await this.playerRankingService.find({
      team: { $in: teamIds },
      rankLock: false,
    });

    if (newTeamRankings.length === 0) return;

    const newRankingItems = [];
    for (let i = 0; i < newTeamRankings.length; i++) {
      const ranking = newTeamRankings[i];
      newRankingItems.push(
        this.playerRankingService.createAnItem({
          player: playerId,
          playerRanking: ranking._id,
          // Append after existing items; offset by idx to avoid duplicate ranks
          // when multiple rankings are updated in the same tick.
          rank: ranking.rankings.length + i + 1,
        }),
      )

    }

    const updatePromises: Promise<unknown>[] = [];
    newRankingItems.forEach((item, idx) => {
      updatePromises.push(
        this.playerRankingService.updateOne(
          { _id: newTeamRankings[idx]._id },
          { $addToSet: { rankings: item._id } },
        ),
      );
    });

    await Promise.all(updatePromises);

    // 3. Re-rank to close any gaps introduced by the append.
    await this.applyReRank(
      newTeamRankings.map((r) => r._id),
      (f) => this.playerRankingService.findItems(f),
      (f, u) => this.playerRankingService.updateOneItem(f, u),
    );
  }

  public async addPlayerToNewTeam(
    player: Player,
    newTeamId: string,
    input: UpdateQuery<Player>,
    updatePromises: Promise<unknown>[],
  ): Promise<void> {
    const playerId = String(player._id);
    // 1. Add player to the new team document.
    updatePromises.push(
      this.teamService.updateOne({ _id: newTeamId }, { $addToSet: { players: playerId } }),
    );

    if (Array.isArray(input.teams)) {
      input.teams.push(newTeamId);
    } else {
      input.teams = player.teams ? [...player.teams, newTeamId] : [newTeamId];
    }

    // 2. Append the player to every unlocked ranking of the new team.
    const newTeam = await this.teamService.findById(newTeamId);
    if (!newTeam) return;

    await this.addPlayerToRankings([newTeam._id], playerId);
  }

  public async handleTeamUpdate(
    player: Player,
    prevTeamId: string | undefined,
    newTeamId: string,
    updatePromises: Promise<unknown>[],
    playerObj: Player,
    input: UpdateQuery<Player>,
  ): Promise<void> {
    const playerId = player._id;
    if (prevTeamId) {
      await this.removePlayerFromPreviousTeam(playerId, prevTeamId, playerObj, input, updatePromises);
    }

    // Always strip captain/co-captain roles when moving teams.
    if ((playerObj.captainofteams && playerObj.captainofteams.length > 0) || (playerObj.captainofteams && playerObj.captainofteams.length > 0)) {
      await this.removeCaptainRoles(playerId, playerObj);
    }

    await this.addPlayerToNewTeam(player, newTeamId, input, updatePromises);
  }

  // ─── updatePlayer ─────────────────────────────────────────────────────────────

  /**
   * Returns a hashed password when a plain-text password is supplied, otherwise
   * returns undefined so the caller can skip the field entirely.
   */
  public async hashPasswordIfProvided(
    plainPassword: string | undefined,
  ): Promise<string | undefined> {
    if (!plainPassword) return undefined;
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword, salt);
  }

  /**
   * Builds the partial User update that should be applied to a captain or
   * co-captain user whenever player profile fields change.
   */
  public async buildUserProfileUpdate(
    input: UpdatePlayerBody['input'],
  ): Promise<Partial<User>> {
    const userUpdate: Partial<User> = {};

    if (input.firstName) userUpdate.firstName = input.firstName;
    if (input.lastName) userUpdate.lastName = input.lastName;

    const hashedPassword = await this.hashPasswordIfProvided(input.password);
    if (hashedPassword) userUpdate.password = hashedPassword;

    return userUpdate;
  }

  public matchToString(match: Match, teamMap: Map<string, Team>): string {
    let matchStr = '';
    matchStr += `${match.description} - `;
    const date = new Date(match.date);

    const day = date.getDate().toString().padStart(2, '0');
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    matchStr += `${day} ${monthName} ${year} -`;

    const teamA = teamMap.get(String(match.teamA));
    const teamB = teamMap.get(String(match.teamB));

    matchStr += ` ${teamA?.name || ''} VS ${teamB?.name || ''}`;

    return matchStr;
  }


    public buildReRankOps(
        items: PlayerRankingItem[],
    ): Array<{ id: unknown; rank: number }> {
        return [...items]
            .sort((a, b) => a.rank - b.rank)
            .map((item, index) => ({ id: item._id, rank: index + 1 }));
    }

    public async applyReRank(
        rankingIds: string[],
        findItems: (filter: object) => Promise<PlayerRankingItem[]>,
        updateOneItem: (filter: object, update: object) => Promise<unknown>,
    ): Promise<void> {
        const reRankOps: Promise<unknown>[] = [];

        for (const rankingId of rankingIds) {
            const items = await findItems({ playerRanking: rankingId });
            const ops = this.buildReRankOps(items);
            for (const { id, rank } of ops) {
                reRankOps.push(updateOneItem({ _id: id }, { $set: { rank } }));
            }
        }

        await Promise.all(reRankOps);
    }

    public async removePlayerFromRankings(prevTeamIds: string[], playerId: string) {
        const prevRankings = await this.playerRankingService.find({
            team: { $in: prevTeamIds },
            rankLock: false,
        });

        if (prevRankings.length > 0) {
            const rankingItems = await Promise.all(
                prevRankings.map((r) => this.playerRankingService.findOneItem({ playerRanking: r._id, player: playerId })
                )
            );

            // Delete found items and pull their IDs from the parent ranking in one batch.
            const deleteOps = rankingItems
                .flatMap((item, idx) => {
                    if (!item) return [];
                    return [
                        this.playerRankingService.updateOne(
                            { _id: prevRankings[idx]._id },
                            { $pull: { rankings: item._id } }
                        ),
                        this.playerRankingService.deleteOneItem({ _id: item._id }),
                    ];
                });

            await Promise.all(deleteOps);

            // Restore a contiguous rank sequence for remaining items.
            await this.applyReRank(
                prevRankings.map((r) => r._id),
                (f) => this.playerRankingService.findItems(f),
                (f, u) => this.playerRankingService.updateOneItem(f, u)
            );
        }
    }


    /**
     * Returns an error response if `normalizedUsername` already belongs to a
     * different player, otherwise null. Comparing by id (not by username string)
     * avoids false positives when a player "changes" their username to a
     * differently-cased version of their own.
     */
    public async checkUsernameConflict(
        currentPlayerId: string,
        normalizedUsername: string,
    ): Promise<PlayerResponse | null> {
        const existingOwner = await this.playerService.findOne({ username: normalizedUsername });

        if (existingOwner && String(existingOwner._id) !== String(currentPlayerId)) {
            return AppResponse.handleError({
                name: 'Duplicate username',
                statusCode: HttpStatus.NOT_ACCEPTABLE,
                message: 'This username is already taken. Please choose a different one.',
            });
        }

        return null;
    }

    /**
     * Pushes an update for whichever of captainuser/cocaptainuser exist on the
     * player. No-op if `update` is empty or neither linked user exists.
     */
    public syncLinkedCaptainUsers(
        player: Player,
        update: Partial<User>,
        updatePromises: Promise<unknown>[],
    ): void {
        if (Object.keys(update).length === 0) return;

        if (player.captainuser) {
            updatePromises.push(this.userService.updateOne({ _id: String(player.captainuser) }, update));
        }
        if (player.cocaptainuser) {
            updatePromises.push(this.userService.updateOne({ _id: String(player.cocaptainuser) }, update));
        }
    }


    /** Strips fields that don't belong on the persisted Player document. */
    public sanitizePlayerUpdateQuery(playerUpdate: UpdateQuery<Player>): void {
        delete playerUpdate.newTeamId;
        delete playerUpdate.prevTeamId;
        // password is stored on the User document, not on Player
        delete playerUpdate.password;
    }


    /**
     * Orchestrates ranking changes triggered by a status transition:
     * - Going INACTIVE: drop the player's ranking items entirely.
     * - Going to any other status: rebuild each team's ranking order from
     *   currently-active players, then append this player at the end.
     */
    public async handlePlayerStatusChange(
        player: Player,
        playerId: string,
        newStatus: EPlayerStatus,
    ): Promise<void> {
        const teamIds = (player.teams as string[]) ?? [];
        if (teamIds.length === 0) return;

        if (newStatus === EPlayerStatus.INACTIVE) {
            await this.removePlayerFromRankings(teamIds, playerId);
            return;
        }

        const teams = await this.teamService.find({ _id: { $in: teamIds } });
        await Promise.all(teams.map((team) => this.resetTeamRankingsForStatusChange(team, player)));
    }


    public async resetTeamRankingsForStatusChange(team: Team, statusChangedPlayer: Player): Promise<void> {
        const teamRankings = (await this.playerRankingService.find({
            team: team._id,
            rankLock: false,
        }));

        await Promise.all(
            teamRankings.map((teamRanking) => this.rebuildTeamRankingOrder(team, teamRanking, statusChangedPlayer)),
        );
    }


    /**
     * Rebuilds one team-ranking's items: preserves relative order for players
     * who already had a rank, places un-ranked players last, then appends the
     * status-changed player at the very end.
     */
    public async rebuildTeamRankingOrder(
        team: Team,
        teamRanking: PlayerRanking,
        statusChangedPlayer: Player,
    ): Promise<void> {
        const existingItems = await this.playerRankingService.findItems({
            _id: { $in: teamRanking.rankings as string[] },
        });
        if (!existingItems) return;

        const rankByPlayerId = new Map<string, number>(
            existingItems.map((item) => [String(item.player), item.rank]),
        );

        // Clear the current ranking items for this team ranking.
        await this.playerRankingService.updateOne(
            { _id: teamRanking._id },
            { $pull: { rankings: { $in: teamRanking.rankings } } },
        );
        await this.playerRankingService.deleteManyItem({ playerRanking: String(teamRanking._id) });

        const activeTeamPlayers = await this.playerService.find({ teams: team._id, status: EPlayerStatus.ACTIVE });
        const sortedPlayers = this.sortPlayersByExistingRank(activeTeamPlayers, rankByPlayerId);

        const newRankingItems = sortedPlayers.map((player, index) => ({
            player: String(player._id),
            playerRanking: teamRanking._id,
            rank: index + 1,
        }));

        // The status-changed player always lands at the end of the new order.
        newRankingItems.push({
            player: String(statusChangedPlayer._id),
            playerRanking: teamRanking._id,
            rank: newRankingItems.length + 1,
        });

        const createdItems = await this.playerRankingService.insertManyItems(newRankingItems);
        await this.playerRankingService.updateOne(
            { _id: teamRanking._id },
            { $addToSet: { rankings: { $each: createdItems.map((item) => item._id) } } },
        );
    }


    /**
     * Sorts players by their previous rank (ascending); players with no prior
     * rank are pushed to the end, in their original relative order.
     */
    public sortPlayersByExistingRank(players: Player[], rankByPlayerId: Map<string, number>): Player[] {
        return [...players].sort((playerA, playerB) => {
            const rankA = rankByPlayerId.get(String(playerA._id));
            const rankB = rankByPlayerId.get(String(playerB._id));

            if (rankA === undefined && rankB === undefined) return 0;
            if (rankA === undefined) return 1;
            if (rankB === undefined) return -1;
            return rankA - rankB;
        });
    }




}