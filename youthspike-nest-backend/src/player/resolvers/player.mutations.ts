import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EventService } from 'src/event/event.service';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from '../player.service';
import { UserService } from 'src/user/user.service';
import { AppResponse } from 'src/shared/response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { EPlayerStatus, Player } from '../player.schema';
import { UpdateQuery } from 'mongoose';
import { CreateMultiPlayerBody, CreatePlayerBody, UpdatePlayerBody, UpdatePlayersInput } from './player.input';
import { ExportOrganizedPlayers, ExportPlayersResponse, PlayerResponse, PlayersResponse } from './player.response';
import { IPlayerMutations } from './player.types';
import { MatchService } from 'src/match/match.service';
import { Match } from 'src/match/match.schema';
import { Team } from 'src/team/team.schema';
import { User } from 'src/user/user.schema';
import { PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { CustomTeam } from 'src/team/resolvers/team.response';

@Injectable()
export class PlayerMutations implements IPlayerMutations {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private matchService: MatchService,
    private cloudinaryService: CloudinaryService,
    private playerService: PlayerService,
    private userService: UserService,
    private playerRankingService: PlayerRankingService,
  ) { }





  // ─── Pure helpers (no side-effects, fully testable) ───────────────────────────

  /**
   * Rebuilds a contiguous 1-based rank sequence from the given items.
   * Returns an array of {_id, rank} pairs ready to be bulk-updated.
   */
  private buildReRankOps(
    items: PlayerRankingItem[],
  ): Array<{ id: unknown; rank: number }> {
    return [...items]
      .sort((a, b) => a.rank - b.rank)
      .map((item, index) => ({ id: item._id, rank: index + 1 }));
  }

  /**
   * Executes re-rank DB writes for a set of player-ranking documents.
   */
  private async applyReRank(
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

  // ─── handleTeamUpdate ─────────────────────────────────────────────────────────

  private async removePlayerFromPreviousTeam(
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

  private async removePlayerFromRankings(prevTeamIds: string[], playerId: string) {
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

  private async removeCaptainRoles(
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

  private async addPlayerToRankings(teamIds: string[], playerId: string) {

    const newTeamRankings = await this.playerRankingService.find({
      team: { $in: teamIds },
      rankLock: false,
    });

    if (newTeamRankings.length === 0) return;

    const newRankingItems = await Promise.all(
      newTeamRankings.map((ranking, idx) =>
        this.playerRankingService.createAnItem({
          player: playerId,
          playerRanking: ranking._id,
          // Append after existing items; offset by idx to avoid duplicate ranks
          // when multiple rankings are updated in the same tick.
          rank: ranking.rankings.length + idx + 1,
        }),
      ),
    );

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

  private async addPlayerToNewTeam(
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

  private async handleTeamUpdate(
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
  private async hashPasswordIfProvided(
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
  private async buildUserProfileUpdate(
    input: UpdatePlayerBody['input'],
  ): Promise<Partial<User>> {
    const userUpdate: Partial<User> = {};

    if (input.firstName) userUpdate.firstName = input.firstName;
    if (input.lastName) userUpdate.lastName = input.lastName;

    const hashedPassword = await this.hashPasswordIfProvided(input.password);
    if (hashedPassword) userUpdate.password = hashedPassword;

    return userUpdate;
  }

  private matchToString(match: Match, teamMap: Map<string, Team>): string {
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

  async createPlayer({ input, profile }: CreatePlayerBody): Promise<PlayerResponse> {
    try {
      // Upload image to cloudinary
      let profileUrl: string | null = null;
      const ensurePromises = [];
      if (profile) profileUrl = await this.cloudinaryService.uploadFiles(profile);

      const playerObj = {
        ...input,
        profile: profileUrl,
        // events: input.events,
        // teams: ,
        name: `${input.firstName}_${input.lastName}`,
      };
      const playerExist = await this.playerService.findOne({ name: playerObj.name, events: { $in: input.events } });
      if (playerExist) {
        return AppResponse.handleError({
          code: 404,
          success: false,
          message: 'There is already a player exist with this name in this event!',
        });
      }
      if (playerObj.email === '') delete playerObj.email;
      if (playerObj.phone === '') delete playerObj.phone;
      if (input.teams) playerObj.teams = input.teams;
      if (!playerObj.username || playerObj.username === '') {
        playerObj.username = this.playerService.playerUsername(playerObj.firstName);
      }
      // if (playerObj.teams) delete playerObj.teams;
      // delete playerObj.event;

      const newPlayer = await this.playerService.create(playerObj);

      if (input.teams) {
        // ===== Update Player Ranking =====
        const teams = await this.teamService.find({ _id: { $in: input.teams } });
        for (const team of teams) {
          const playerRankings = await this.playerRankingService.find({ team: team._id, rankLock: false });
          if (playerRankings && playerRankings.length > 0) {
            // Looping all player rankings of a team
            for (const pr of playerRankings) {
              // If ranking is locked, then add that player only to one team player ranking (not in the ranking that has specific match)
              if (pr.rankLock && pr.match) continue;

              const rankings = await this.playerRankingService.findItems({ playerRanking: pr._id });
              const highestRank = rankings.length === 0 ? 0 : Math.max(...rankings.map((p) => p.rank));

              // Insert that ranking iteam
              const itemsToInsert = [];
              const playerIds = [...team.players, newPlayer._id];
              let rankIncrement = 0;
              for (let i = 0; i < playerIds.length; i += 1) {
                // If there is no player then add them
                const findRank = rankings.find((r) => r.player?.toString() === playerIds[i].toString());
                if (!findRank) {
                  itemsToInsert.push({
                    player: playerIds[i],
                    rank: highestRank + rankIncrement + 1,
                    playerRanking: pr._id,
                  });
                  rankIncrement += 1;
                }
              }
              // Create new ranking item
              const rankingItems = await this.playerRankingService.insertManyItems(itemsToInsert);
              // Add those item to relational playerRanking
              ensurePromises.push(
                this.playerRankingService.updateOne(
                  { _id: pr._id },
                  { $addToSet: { rankings: { $each: rankingItems.map((ri) => ri._id) } } },
                ),
              );
            }
          }
          ensurePromises.push(this.teamService.updateOne({ _id: team }, { $addToSet: { players: newPlayer._id } }));
        }
      }
      ensurePromises.push(
        this.eventService.updateOne(
          { _id: { $in: input.teams } },
          { $addToSet: { players: newPlayer._id } },
        ),
      );
      await Promise.all(ensurePromises);

      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'Player has been created successfully!',
        data: newPlayer,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  async deletePlayer(playerId: string) {
    /**
     * TODO:
     *    Step-1: Delete player
     *    Step-2: Remove player from all the related fields
     */
    try {
      const playerExist = await this.playerService.findById(playerId);
      if (!playerExist) return AppResponse.notFound('Player');

      const updatePromises = [];

      if (playerExist.events && playerExist.events.length > 0) {
        updatePromises.push(
          this.eventService.updateOne({ _id: { $in: playerExist.events.map(e => String(e)) } }, { $pull: { players: playerId } }),
        );
      }

      if (playerExist.teams && playerExist.teams.length > 0) {
        updatePromises.push(
          this.teamService.updateOne({ _id: { $in: playerExist.teams.map(t => String(t)) } }, { $pull: { players: playerId } }),
        );

        updatePromises.push(this.playerRankingService.deleteOneItem({ player: playerId }));
      }

      if (playerExist.captainofteams && playerExist.captainofteams.length > 0) {
        updatePromises.push(
          this.teamService.updateMany({ _id: { $in: playerExist.captainofteams.map(p => String(p)) } }, { $pull: { players: playerId } }),
        );
      }

      if (playerExist.cocaptainofteams && playerExist.cocaptainofteams.length > 0) {
        updatePromises.push(
          this.teamService.updateMany({ _id: { $in: playerExist.cocaptainofteams.map(cc => String(cc)) } }, { $pull: { players: playerId } }),
        );
      }

      if (playerExist.captainuser) {
        updatePromises.push(this.userService.deleteOne({ _id: playerExist.captainuser }));
      }

      if (playerExist.cocaptainuser) {
        updatePromises.push(this.userService.deleteOne({ _id: playerExist.cocaptainuser }));
      }

      updatePromises.push(this.playerService.deleteOne({ _id: playerId }));

      await Promise.all(updatePromises);

      return {
        code: HttpStatus.NO_CONTENT,
        success: true,
        message: 'Player has been deleted successfully!',
      };
    } catch (error) {
      console.error('Error in createMultiPlayers:', error);
      // Customize the error response based on the type of error
      return AppResponse.handleError(error);
    }
  }

  async createMultiPlayers({ division, eventId, uploadedFile }: CreateMultiPlayerBody) {
    /**
     * TODO:
     *    Step-1: Check file type (Validation)
     *    Step-2: Convert it to array of object
     *    Step-3: Create multiple record at once and return
     *    Step-4: Add team if a team is associated with it
     */
    try {
      const allowedFileTypes = ['csv', 'xlsx']; // Add the allowed file types
      const uploaded = await uploadedFile as any;
      const fileExtension = uploaded?.filename?.split('.').pop().toLowerCase();
      if (!allowedFileTypes.includes(fileExtension)) {
        return AppResponse.invalidFile('Please upload a CSV or XLSX file!');
      }

      let { teams, unassignedPlayers } = await this.playerService.arrangeFromCSV(uploaded, eventId, division);
      const playerIds = [];
      const teamIds = [];
      const promiseOperations = [];
      const teamNames = teams.map((team) => team.name);

      /*
      // Find all teams from the database (division and event must match as well)
      const prevTeams = await this.teamService.find({
        name: { $in: teamNames.map(name => new RegExp(`^${name}$`, 'i')) },
        events: eventId
      });
      const prevTeamNames = new Set<string>();
      // Update previous teams
      for (let i = 0; i < prevTeams.length; i+=1) {
        const team = prevTeams[i];
        prevTeamNames.add(team.name);
        const updateState: Partial<CustomTeam> = {};
        if(team.division !== division){
          updateState.division = team.division;
        }

        // Update player 
        let prevPlayerIds = [...team.players];

        
        // and update player ranking

        // Update player
        promiseOperations.push(this.teamService.updateOne({_id: team._id}, {$set: updateState}));


      }
      // Remove all those teams from to be created team list
      */

      for (let i = 0; i < teams.length; i += 1) {
        try {
          const teamObj = { ...teams[i] };
          // If there is a previous team skip it, because we have already updated
          // if(prevTeamNames.has(teamObj.name)) {
          //   continue;
          // }
          let teamPlayers = [...teams[i].players];
          const playerNames = teamPlayers.map((p) => typeof p === 'object' && p.name);
          const duplicatePlayers = await this.playerService.find({ name: { $in: playerNames }, events: eventId });
          if (duplicatePlayers.length > 0) {
            const duplicateNames = new Set(duplicatePlayers.map((p) => p.name));
            teamPlayers = teamPlayers.filter((p: Player) => !duplicateNames.has(p.name));
          }
          const playerList = await this.playerService.createMany(teamPlayers);
          const teamPlayerIds = playerList.map((p) => p._id);
          playerIds.push(...teamPlayerIds);
          teamObj.players = teamPlayerIds as string[];
          // const teamExist = await this.teamService.findOne({ event: eventId, name: teamObj.name });
          const teamExist = await this.teamService.findOne({
            name: new RegExp(
              `^${teamObj.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            ),
            events: eventId,
          });
          // const eventExist = await this.eventService.findById(eventId);
          let team = teamExist;
          if (teamExist) {
            // const teamPlayers = [...teamExist.players, ...teamPlayerIds];
            await this.teamService.updateOne(
              { _id: teamExist._id },
              {
                $set: { name: teamObj.name },
                $addToSet: { players: { $each: teamPlayerIds } },
              },
            );
          } else {
            team = await this.teamService.create(teamObj);
          }
          teamIds.push(team._id);

          // ===== Create Ranking =====
          const rankings = [];
          for (let i = 0; i < teamPlayerIds.length; i += 1) {
            promiseOperations.push(
              this.playerService.updateOne({ _id: teamPlayerIds[i] }, { $addToSet: { teams: team._id } }),
            );
            // Create player ranking when creating team
            const playerRank = teamExist ? teamExist.players.length + i + 1 : i + 1;
            rankings.push({ rank: playerRank, player: teamPlayerIds[i] });
          }

          // Update player ranking
          const teamPlayerRankings = await this.playerRankingService.find({ team: team._id });
          const teamPlayerRankingIds = [];
          for (const pr of teamPlayerRankings) {
            if (pr.rankLock && pr.match) continue;

            // Creating all new rankings
            const newRankings = await this.playerRankingService.insertManyItems(
              rankings.map((r) => ({ ...r, playerRanking: pr._id })),
            );

            await this.playerRankingService.updateOne(
              { _id: pr._id },
              { $addToSet: { rankings: { $each: newRankings.map((nr) => nr._id) } } },
            );

            teamPlayerRankingIds.push(pr._id);
          }

          // If there are no player ranking created it
          if (teamPlayerRankings.length === 0) {
            const playerRanking = await this.playerRankingService.create({
              // With create functiion, items are creating also
              rankings,
              rankLock: false,
              team: team._id,
            });
            teamPlayerRankingIds.push(playerRanking._id);
          }

          promiseOperations.push(
            this.teamService.updateOne(
              { _id: team._id },
              { $addToSet: { playerRankings: { $each: teamPlayerRankingIds } } },
            ),
          );

          promiseOperations.push(
            this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $addToSet: { teams: team._id } }),
          );
        } catch (dErrs: any) {
          console.log(dErrs);
        }
      }

      // Check player already created or not in the same event
      const playerNames = unassignedPlayers.map((p) => p.name);
      const duplicatePlayers = await this.playerService.find({ name: { $in: playerNames }, events: eventId });
      if (duplicatePlayers.length > 0) {
        const duplicateNames = new Set(duplicatePlayers.map((p) => p.name));
        unassignedPlayers = unassignedPlayers.filter((p) => !duplicateNames.has(p.name));
      }
      const allPlayers = await this.playerService.createMany(unassignedPlayers);
      await Promise.all(promiseOperations);
      const unassignedPlayerIds = allPlayers.map((p) => p._id);
      playerIds.push(...unassignedPlayerIds);
      await this.eventService.updateOne(
        { _id: eventId },
        { $addToSet: { teams: { $each: teamIds }, players: { $each: playerIds } } },
      );

      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'Multiple Players have been created successfully!',
        data: [], // allPlayers
      };
    } catch (error) {
      console.error('Error in createMultiPlayers:', error);
      // Customize the error response based on the type of error
      return AppResponse.handleError(error);
    }
  }



  async updatePlayer({ input, playerId, profile }: UpdatePlayerBody): Promise<PlayerResponse> {
    try {
      const playerExist = await this.playerService.findById(playerId);
      if (!playerExist) return AppResponse.notFound('Player');

      const updatePromises: Promise<unknown>[] = [];
      const playerUpdate: UpdateQuery<Player> = { ...input };

      // ── Profile image ──────────────────────────────────────────────────────
      if (profile) {
        playerUpdate.profile = await this.cloudinaryService.uploadFiles(profile);
      }

      // ── Username uniqueness + linked user email sync ───────────────────────
      if (input.username) {
        const newUsername = input.username.toLowerCase();
        const existingOwner = await this.playerService.findOne({ username: newUsername });

        if (existingOwner && existingOwner.username !== playerExist.username) {
          return AppResponse.handleError({
            name: 'Duplicate username',
            statusCode: HttpStatus.NOT_ACCEPTABLE,
            message: 'This username is already taken. Please choose a different one.',
          });
        }

        const emailUpdate = { email: newUsername };
        if (playerExist.captainuser) {
          updatePromises.push(
            this.userService.updateOne({ _id: String(playerExist.captainuser) }, emailUpdate),
          );
        }
        if (playerExist.cocaptainuser) {
          updatePromises.push(
            this.userService.updateOne({ _id: String(playerExist.cocaptainuser) }, emailUpdate),
          );
        }
      }

      // ── Team transfer ──────────────────────────────────────────────────────
      if (input.newTeamId) {
        if (input.prevTeamId && input.prevTeamId === input.newTeamId) {
          return AppResponse.handleError({
            name: 'Invalid team',
            message: 'The player is already assigned to this team.',
          });
        }

        await this.handleTeamUpdate(
          playerExist,
          input.prevTeamId,
          input.newTeamId,
          updatePromises,
          playerExist,
          playerUpdate,
        );
      }


      if (input.status && input.status !== playerExist.status) {
        // If inactive then remove ranking, and rerank them
        if (input.status === EPlayerStatus.INACTIVE) {
          // Delete previous ranking
          if (playerExist.teams && playerExist.teams.length > 0) {
            await this.removePlayerFromRankings(playerExist.teams as string[], playerId);
          }
        } else if (playerExist.teams && playerExist.teams.length > 0) {
          // if active again then add ranking 
          await this.addPlayerToRankings(playerExist.teams as string[], playerId);
        }
      }

      // ── Linked captain/co-captain user profile sync ────────────────────────
      const userProfileUpdate = await this.buildUserProfileUpdate(input);
      if (Object.keys(userProfileUpdate).length > 0) {
        if (playerExist.captainuser) {
          updatePromises.push(
            this.userService.updateOne({ _id: String(playerExist.captainuser) }, userProfileUpdate),
          );
        }
        if (playerExist.cocaptainuser) {
          updatePromises.push(
            this.userService.updateOne({ _id: String(playerExist.cocaptainuser) }, userProfileUpdate),
          );
        }
      }

      // ── Clean up transfer fields before persisting the player doc ──────────
      delete playerUpdate.newTeamId;
      delete playerUpdate.prevTeamId;
      // password is stored on the User document, not on Player
      delete playerUpdate.password;

      if (Object.keys(playerUpdate).length > 0) {
        updatePromises.push(this.playerService.updateOne({ _id: playerId }, playerUpdate));
      }

      await Promise.all(updatePromises);

      const updatedPlayer = await this.playerService.findById(playerId);

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'Player has been updated successfully!',
        data: updatedPlayer,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }



  async exportPlayers(eventId: string) {
    try {
      // Get all players
      const players = await this.playerService.find({ events: eventId });
      const playerIds = new Set(players.map((p) => String(p._id)));

      const teams = await this.teamService.find({
        events: eventId,
        $or: [{ players: { $in: [...playerIds] } }, { moved: { $in: [...playerIds] } }],
      });
      // const teamIds = new Set(teams.map((t) => String(t._id)));
      const teamIds = new Set<string>();
      const teamMap = new Map<string, Team>();
      const teamByPlayer = new Map<string, Team>();
      for (let i = 0; i < teams.length; i += 1) {
        const team = teams[i];
        teamIds.add(String(team._id));
        teamMap.set(String(team._id), team);

        // Current team
        for (let j = 0; j < team.players.length; j += 1) {
          const player = team.players[j];
          teamByPlayer.set(String(player), team);
        }

        // Previous teams
        for (let j = 0; j < (team?.moved || []).length; j += 1) {
          const player = team.moved[j];
          teamByPlayer.set(String(player), team);
        }
      }
      //  I need name, team, match info and the division the match was in.  or labeled at not a division (Out of division)
      const matches = await this.matchService.find({
        event: eventId,
        $or: [{ teamA: { $in: [...teamIds] } }, { teamB: { $in: [...teamIds] } }],
      });
      const matchByTeam = new Map<string, Match[]>();
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const teamA = String(match.teamA);
        const teamB = String(match.teamB);

        // Add match to teamA list
        if (!matchByTeam.has(teamA)) {
          matchByTeam.set(teamA, []);
        }
        matchByTeam.get(teamA)!.push(match);

        // Add match to teamB list
        if (!matchByTeam.has(teamB)) {
          matchByTeam.set(teamB, []);
        }
        matchByTeam.get(teamB)!.push(match);
      }

      const organizedPlayers: ExportOrganizedPlayers[] = [];

      for (let i = 0; i < players.length; i += 1) {
        const player = players[i];
        const team = teamByPlayer.get(String(player._id));
        const matchesOfAPlayer = team ? matchByTeam.get(String(team._id)) ?? [] : [];

        const matchStrList = [];
        for (let j = 0; j < (matchesOfAPlayer || []).length; j += 1) {
          const match = matchesOfAPlayer[j];
          const matchStr = this.matchToString(match, teamMap);
          matchStrList.push(matchStr);
        }
        const row = {
          _id: String(player._id),
          name: player.firstName + ' ' + player.lastName,
          username: player.username,
          division: player.division,
          team: team ? team?.name : null,
          matches: matchStrList || [],
        };
        organizedPlayers.push(row);
      }

      return {
        code: HttpStatus.ACCEPTED,
        message: 'Player has been updated successfully!',
        success: true,
        data: organizedPlayers,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }
}
