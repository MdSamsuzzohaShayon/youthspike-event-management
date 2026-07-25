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
import PlayerHelper from './player.helpers';
import { BadgeService } from 'src/badge/badge.service';

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
    private badgeService: BadgeService,

    // Helpers
    private readonly playerHelpers: PlayerHelper
  ) { }




  // ── createPlayer ──────────────────────────────────────────────────────
  async createPlayer({ input, profile }: CreatePlayerBody): Promise<PlayerResponse> {
    try {
      const playerName = this.playerHelpers.buildPlayerFullName(input.firstName, input.lastName);

      const duplicatePlayerExists = await this.playerService.findOne({
        name: playerName,
        events: { $in: input.events },
      });
      if (duplicatePlayerExists) {
        return AppResponse.handleError({
          code: 404,
          success: false,
          message: 'There is already a player exist with this name in this event!',
        });
      }

      const newPlayerDocument = await this.playerHelpers.buildNewPlayerDocument(input, profile, playerName);
      const newPlayer = await this.playerService.create(newPlayerDocument);

      const postCreateTasks: Promise<unknown>[] = [];

      if (input.badge) {
        postCreateTasks.push(
          this.badgeService.updateOne({ _id: input.badge }, { $addToSet: { players: newPlayer._id } }),
        );
      }

      if (input.teams?.length) {
        postCreateTasks.push(this.playerHelpers.assignPlayerToTeams(String(newPlayer._id), input.teams));
      }

      if (input.events?.length) {
        // BUG FIX: was querying eventService with input.teams; events are matched by input.events.
        postCreateTasks.push(
          this.eventService.updateOne(
            { _id: { $in: input.events } },
            { $addToSet: { players: newPlayer._id } },
          ),
        );
      }

      await Promise.all(postCreateTasks);

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



  // ─── updatePlayer ────────────────────────────────────────────────────────────

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

      if (input.badge) {
        // && playerExist.badge && input.badge !== String(playerExist.badge)
        if (!playerExist.badge) {
          updatePromises.push(this.badgeService.updateOne({ _id: input.badge }, { $addToSet: { players: playerId } }));
        } else {
          if (String(playerExist.badge) !== input.badge) {
            updatePromises.push(this.badgeService.updateOne({ _id: playerExist.badge }, { $pull: { players: playerId } }));
            updatePromises.push(this.badgeService.updateOne({ _id: input.badge }, { $addToSet: { players: playerId } }));
          }
        }
      }

      // ── Username uniqueness + linked user email sync ───────────────────────
      if (input.username) {
        const normalizedUsername = input.username.toLowerCase();
        const usernameConflict = await this.playerHelpers.checkUsernameConflict(playerId, normalizedUsername);
        if (usernameConflict) return usernameConflict;

        this.playerHelpers.syncLinkedCaptainUsers(playerExist, { email: normalizedUsername }, updatePromises);
      }

      // ── Team transfer ──────────────────────────────────────────────────────
      if (input.newTeamId) {
        if (input.prevTeamId && input.prevTeamId === input.newTeamId) {
          return AppResponse.handleError({
            name: 'Invalid team',
            message: 'The player is already assigned to this team.',
          });
        }

        await this.playerHelpers.handleTeamUpdate(
          playerExist,
          input.prevTeamId,
          input.newTeamId,
          updatePromises,
          playerExist,
          playerUpdate,
        );
      }

      // ── Status transition (ranking rebuild) ─────────────────────────────────
      if (input.status && input.status !== playerExist.status) {
        await this.playerHelpers.handlePlayerStatusChange(playerExist, playerId, input.status);
      }

      // ── Linked captain/co-captain profile sync ──────────────────────────────
      const userProfileUpdate = await this.playerHelpers.buildUserProfileUpdate(input);
      this.playerHelpers.syncLinkedCaptainUsers(playerExist, userProfileUpdate, updatePromises);

      // ── Clean up transfer fields before persisting the player doc ──────────
      this.playerHelpers.sanitizePlayerUpdateQuery(playerUpdate);

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
          const matchStr = this.playerHelpers.matchToString(match, teamMap);
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
