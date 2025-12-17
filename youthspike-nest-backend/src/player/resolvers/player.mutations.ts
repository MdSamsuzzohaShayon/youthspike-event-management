import { HttpStatus, Injectable } from '@nestjs/common';
import { EventService } from 'src/event/event.service';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from '../player.service';
import { UserService } from 'src/user/user.service';
import { AppResponse } from 'src/shared/response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { Player } from '../player.schema';
import { UpdateQuery } from 'mongoose';
import { CreateMultiPlayerBody, CreatePlayerBody, UpdatePlayerBody, UpdatePlayersInput } from './player.input';
import { ExportOrganizedPlayers, ExportPlayersResponse, PlayerResponse, PlayersResponse } from './player.response';
import { IPlayerMutations } from './player.types';
import { MatchService } from 'src/match/match.service';
import { Match } from 'src/match/match.schema';
import { Team } from 'src/team/team.schema';

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
  ) {}

  private async handleTeamUpdate(
    playerId: string,
    currentTeams: string[],
    newTeamId: string,
    updatePromises: Promise<any>[],
    playerObj: Player,
    input: UpdateQuery<Player>,
  ) {
    if (currentTeams.length > 0) {
      // ✅ 1. Remove player from old team(s) (single DB call)
      updatePromises.push(
        this.teamService.updateOne(
          { _id: { $in: currentTeams } },
          { $pull: { players: playerId }, $addToSet: { moved: playerId } },
        ),
      );

      // ✅ 2. Fetch all previous rankings & items in parallel
      const prevRankings = await this.playerRankingService.find({
        team: { $in: currentTeams },
        rankLock: false,
      });

      if (prevRankings.length > 0) {
        // 🔄 Instead of looping with await, build all queries first
        const rankingItemLookups = prevRankings.map((r) =>
          this.playerRankingService.findOneItem({ playerRanking: r._id, player: playerId }),
        );

        const rankingItems = await Promise.all(rankingItemLookups);

        // Delete ranking items & update rankings in one batch
        const deleteAndPullOps = rankingItems
          .filter(Boolean)
          .flatMap((item, idx) => [
            this.playerRankingService.updateOne({ _id: prevRankings[idx]._id }, { $pull: { rankings: item!._id } }),
            this.playerRankingService.deleteOneItem({ _id: item!._id }),
          ]);

        await Promise.all(deleteAndPullOps);

        // ✅ 3. Re-rank remaining players (parallel updates)
        const reRankOps: Promise<any>[] = [];
        for (const pr of prevRankings) {
          const rankingItems = await this.playerRankingService.findItems({ playerRanking: pr._id });

          // Use in-place sort (no extra array)
          rankingItems.sort((a, b) => a.rank - b.rank);

          // Build all update promises without awaiting each one
          rankingItems.forEach((item, index) => {
            reRankOps.push(this.playerRankingService.updateOneItem({ _id: item._id }, { $set: { rank: index + 1 } }));
          });
        }

        await Promise.all(reRankOps);
      }

      // ✅ 4. Update player's team list efficiently
      const existingTeams: string[] = Array.isArray(playerObj?.teams) ? playerObj.teams.map((t) => t.toString()) : [];

      input.teams = existingTeams.filter((t) => !currentTeams.includes(t));
      input.$addToSet = { prevteams: currentTeams[0] };
    }

    // Remove as captain or co-captain from current team
    if (playerObj?.captainofteams?.length > 0) {
      await Promise.all([
        this.teamService.updateMany(
          { _id: { $in: playerObj.captainofteams.map(team => team?.toString()) } },
          { $set: { captain: null } }
        ),

        this.playerService.updateOne(
          { _id: playerId },
          { $pull: { captainofteams: { $in: playerObj.captainofteams } } },
        ),
      ]);
    }

    if (playerObj?.cocaptainofteams?.length > 0) {
      await Promise.all([
        this.teamService.updateMany({ _id: { $in: playerObj.cocaptainofteams.map(cc => cc?.toString()) } }, { $set: { cocaptain: null } }),

        this.playerService.updateOne(
          { _id: playerId },
          { $pull: { cocaptainofteams: { $in: playerObj.cocaptainofteams } } },
        ),
      ]);
    }

    // ✅ 5. Add player to new team (single DB call)
    updatePromises.push(this.teamService.updateOne({ _id: newTeamId }, { $addToSet: { players: playerId } }));
    input.teams.push(newTeamId);

    // ✅ 6. Add player to new team's rankings in parallel
    const newTeam = await this.teamService.findById(newTeamId);
    if (newTeam) {
      const newTeamRankings = await this.playerRankingService.find({ team: newTeam._id, rankLock: false });

      // Prepare all ranking insertions first
      const newRankingItemPromises = newTeamRankings.map((ranking, idx) =>
        this.playerRankingService.createAnItem({
          player: playerId,
          playerRanking: ranking._id,
          rank: ranking.rankings.length + 1 + idx,
        }),
      );

      const newRankingItems = await Promise.all(newRankingItemPromises);

      // Push all updates into updatePromises (no extra await here)
      newRankingItems.forEach((item, idx) => {
        updatePromises.push(
          this.playerRankingService.updateOne({ _id: newTeamRankings[idx]._id }, { $addToSet: { rankings: item._id } }),
        );
      });

      // ✅ 3. Re-rank remaining players (parallel updates)
      const newRankings = await this.playerRankingService.find({ team: newTeam._id, rankLock: false });
      const reRankOps: Promise<any>[] = [];
      for (const pr of newRankings) {
        const rankingItems = await this.playerRankingService.findItems({ playerRanking: pr._id });

        // Use in-place sort (no extra array)
        rankingItems.sort((a, b) => a.rank - b.rank);

        // Build all update promises without awaiting each one
        rankingItems.forEach((item, index) => {
          reRankOps.push(this.playerRankingService.updateOneItem({ _id: item._id }, { $set: { rank: index + 1 } }));
        });
      }

      await Promise.all(reRankOps);
    }
  }

  private matchToString(match: Match, teamMap: Map<string, Team>) {
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
    /**
     * TODO:
     *    Step-1: Get all the inputs
     *    Step-2: Upload a profile picture
     *    Step-3: Make one to many relationship with event
     *    Step-4: Update events
     */
    try {
      // Upload image to cloudinary
      let profileUrl: string | null = null;
      const ensurePromises = [];
      if (profile) profileUrl = await this.cloudinaryService.uploadFiles(profile);

      const playerObj = {
        ...input,
        profile: profileUrl,
        events: [input.event],
        teams: [],
        name: `${input.firstName}_${input.lastName}`,
      };
      const playerExist = await this.playerService.findOne({ name: playerObj.name, events: input.event });
      if (playerExist) {
        return AppResponse.handleError({
          code: 404,
          success: false,
          message: 'There is already a player exist with this name in this event!',
        });
      }
      if (playerObj.email === '') delete playerObj.email;
      if (playerObj.phone === '') delete playerObj.phone;
      if (input.team) playerObj.teams = [input.team];
      if (!playerObj.username || playerObj.username === '') {
        playerObj.username = this.playerService.playerUsername(playerObj.firstName);
      }
      if (playerObj.team) delete playerObj.team;
      delete playerObj.event;

      const newPlayer = await this.playerService.create(playerObj);

      if (input.team) {
        // ===== Update Player Ranking =====
        const [playerRankings, teamExist] = await Promise.all([
          this.playerRankingService.find({ team: input.team, rankLock: false }),
          this.teamService.findById(input.team),
        ]);
        if (playerRankings && playerRankings.length > 0) {
          // Looping all player rankings of a team
          for (const pr of playerRankings) {
            // If ranking is locked, then add that player only to one team player ranking (not in the ranking that has specific match)
            if (pr.rankLock && pr.match) continue;

            const rankings = await this.playerRankingService.findItems({ playerRanking: pr._id });
            const highestRank = rankings.length === 0 ? 0 : Math.max(...rankings.map((p) => p.rank));

            // Insert that ranking iteam
            const itemsToInsert = [];
            const playerIds = [...teamExist.players, newPlayer._id];
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
        ensurePromises.push(this.teamService.updateOne({ _id: input.team }, { $addToSet: { players: newPlayer._id } }));
      }
      ensurePromises.push(
        this.eventService.updateOne(
          { _id: input.event.toString() },
          { $addToSet: { players: newPlayer._id.toString() } },
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
      for (let i = 0; i < teams.length; i += 1) {
        try {
          const teamObj = { ...teams[i] };
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
          const teamExist = await this.teamService.findOne({ event: eventId, name: teamObj.name });
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

  async updatePlayers(input: UpdatePlayersInput[]): Promise<PlayersResponse> {
    try {
      if (input && input.length > 0) {
        const updatePromises = [];
        let teamIds = [];
        for (let i = 0; i < input.length; i++) {
          const playerId = input[i]._id;
          const playerExist = await this.playerService.findById(playerId);
          if (!playerExist) continue;
          teamIds = playerExist.teams;
          const playerObj: UpdateQuery<Player> = { ...input[i], teams: teamIds || [] };
          // Move one team to another
          if (playerObj.team) {
            await this.handleTeamUpdate(playerId, teamIds, playerObj.team, updatePromises, playerExist, playerObj);
            playerObj.teams = [playerObj.team];
            delete playerObj.team;
          }
          if (playerObj._id) delete playerObj._id;
          updatePromises.push(this.playerService.updateOne({ _id: playerId }, playerObj));
        }
        await Promise.all(updatePromises);
      }
      const findPlayers = await this.playerService.find({ _id: { $in: input.map((i) => i._id) } });
      return {
        code: HttpStatus.ACCEPTED,
        message: 'Multiple Players have been created successfully!',
        success: true,
        data: findPlayers,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  async updatePlayer({ input, playerId, profile }: UpdatePlayerBody): Promise<PlayerResponse> {
    try {
      const updatePromises: Promise<any>[] = [];
      const playerExist = await this.playerService.findById(playerId);
      if (!playerExist) return AppResponse.notFound('Player');

      const playerObj: UpdateQuery<Player> = { ...input };

      // Upload image if profile is provided
      if (profile) {
        playerObj.profile = await this.cloudinaryService.uploadFiles(profile);
      }

      // Check for duplicate username
      if (input.username) {
        const newUsername = input.username.toLowerCase();
        const duplicateUser = await this.playerService.findOne({ username: newUsername });

        const isDuplicate = duplicateUser && duplicateUser.username !== playerExist.username;
        if (isDuplicate) {
          return AppResponse.handleError({
            name: 'Duplicate username',
            statusCode: HttpStatus.NOT_ACCEPTABLE,
            message:
              'Use another username in order to change the username, this username has been used by someone else.',
          });
        }

        // Update captain/co-captain user email
        const updateUserEmail = { email: newUsername };
        updatePromises.push(
          this.userService.updateOne({ captainplayer: playerExist._id }, updateUserEmail),
          this.userService.updateOne({ cocaptainplayer: playerExist._id }, updateUserEmail),
        );
      }

      // If changing teams
      const isTeamChange = input.newTeamId && input.team && input.team !== input.newTeamId;

      if (input.newTeamId && input.team && !isTeamChange) {
        return AppResponse.handleError({
          name: 'Invalid team',
          message: 'New team and previous team both are same, therefore no need to change',
        });
      }

      if (isTeamChange) {
        const currTeamIds = playerExist.teams.map((p) => p.toString());
        await this.handleTeamUpdate(
          playerId,
          [...currTeamIds],
          input.newTeamId,
          updatePromises,
          playerExist,
          playerObj,
        );
      }

      // Update firstName/lastName in user if player is captain/co-captain
      const updateUserName: Partial<{ firstName: string; lastName: string }> = {};
      if (input.firstName) updateUserName.firstName = input.firstName;
      if (input.lastName) updateUserName.lastName = input.lastName;

      if ((playerExist.captainuser || playerExist.cocaptainuser) && Object.keys(updateUserName).length) {
        const userId = playerExist.captainuser || playerExist.cocaptainuser;
        updatePromises.push(this.userService.updateOne({ _id: userId.toString() }, updateUserName));
      }

      // Cleanup fields that shouldn't be updated
      delete playerObj.team;
      delete playerObj.newTeamId;

      if (Object.keys(playerObj).length) {
        updatePromises.push(this.playerService.updateOne({ _id: playerId }, playerObj));
      }

      await Promise.all(updatePromises);
      const findPlayer = await this.playerService.findById(playerId);

      return {
        code: HttpStatus.ACCEPTED,
        message: 'Player has been updated successfully!',
        success: true,
        data: findPlayer,
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
        event: eventId,
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
