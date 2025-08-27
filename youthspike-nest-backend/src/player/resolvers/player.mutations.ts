import { HttpStatus, Injectable } from '@nestjs/common';
import { Args, ObjectType } from '@nestjs/graphql';
import { EventService } from 'src/event/event.service';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from '../player.service';
import { UserService } from 'src/user/user.service';
import { AppResponse } from 'src/shared/response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { Player } from '../player.schema';
import { UpdateQuery } from 'mongoose';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { CreateMultiPlayerBody, UpdatePlayerBody, UpdatePlayerInput, UpdatePlayersInput } from './player.input';
import { PlayerResponse, PlayersResponse } from './player.response';
import { IPlayerMutations } from './player.types';

@Injectable()
export class PlayerMutations implements IPlayerMutations {

  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private cloudinaryService: CloudinaryService,
    private playerService: PlayerService,
    private userService: UserService,
    private playerRankingService: PlayerRankingService
  ) {}


  private async handleTeamUpdate(
    playerId: string,
    currentTeams: string[],
    newTeamId: string,
    updatePromises: Promise<any>[],
    playerObj: Player,
    input: UpdateQuery<Player>,
  ) {
    // Remove player from old team(s)
    if (currentTeams.length > 0) {
      updatePromises.push(this.teamService.updateOne({ _id: { $in: currentTeams } }, { $pull: { players: playerId } }));
      // 1️⃣ Normalise: always end up with string[]
      const existingTeams: string[] = Array.isArray(playerObj?.teams)
        ? (playerObj.teams as unknown[]).map((t) => t.toString())
        : [];

      // 2️⃣ Filter out the teams you’re removing
      input.teams = existingTeams.filter((t) => !currentTeams.includes(t));
    }

    // Add player to the new team
    updatePromises.push(this.teamService.updateOne({ _id: newTeamId }, { $addToSet: { players: playerId } }));
    // Later, when you add the new team:
    input.teams.push(newTeamId);

    // Remove player rankings from previous team
    const currentRankings = await this.playerRankingService.find({ team: currentTeams[0] });
    const rankingItems = await this.playerRankingService.findItems({ player: playerId });

    if (rankingItems.length) {
      const rankingItemIds = rankingItems.map((r) => r._id);
      for (const ranking of currentRankings) {
        updatePromises.push(
          this.playerRankingService.updateOne({ _id: ranking._id }, { $pull: { rankings: { $in: rankingItemIds } } }),
        );
      }
      updatePromises.push(this.playerRankingService.deleteManyItem({ _id: { $in: rankingItemIds } }));
    }

    // Add player to new team's rankings
    const newTeam = await this.teamService.findById(newTeamId);
    if (newTeam) {
      const newTeamRankings = await this.playerRankingService.find({ team: newTeam._id });
      for (let i = 0; i < newTeamRankings.length; i++) {
        const ranking = newTeamRankings[i];
        const newRankingItem = await this.playerRankingService.createAnItem({
          player: playerId,
          playerRanking: ranking._id,
          rank: ranking.rankings.length + 1 + i,
        });
        updatePromises.push(
          this.playerRankingService.updateOne({ _id: ranking._id }, { $addToSet: { rankings: newRankingItem._id } }),
        );
      }
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
          this.eventService.updateOne({ _id: { $in: playerExist.events } }, { $pull: { players: playerId } }),
        );
      }

      if (playerExist.teams && playerExist.teams.length > 0) {
        updatePromises.push(
          this.teamService.updateOne({ _id: { $in: playerExist.teams } }, { $pull: { players: playerId } }),
        );

        updatePromises.push(this.playerRankingService.deleteOneItem({ player: playerId }));
      }

      if (playerExist.captainofteams && playerExist.captainofteams.length > 0) {
        updatePromises.push(
          this.teamService.updateMany({ _id: { $in: playerExist.captainofteams } }, { $pull: { players: playerId } }),
        );
      }

      if (playerExist.cocaptainofteams && playerExist.cocaptainofteams.length > 0) {
        updatePromises.push(
          this.teamService.updateMany({ _id: { $in: playerExist.cocaptainofteams } }, { $pull: { players: playerId } }),
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

  async createMultiPlayers({division, eventId, uploadedFile}: CreateMultiPlayerBody) {
    /**
     * TODO:
     *    Step-1: Check file type (Validation)
     *    Step-2: Convert it to array of object
     *    Step-3: Create multiple record at once and return
     *    Step-4: Add team if a team is associated with it
     */
    try {
      const allowedFileTypes = ['csv', 'xlsx']; // Add the allowed file types
      const uploaded = await uploadedFile;
      const fileExtension = uploaded.filename.split('.').pop().toLowerCase();
      if (!allowedFileTypes.includes(fileExtension)) {
        return AppResponse.invalidFile('Please upload a CSV or XLSX file!');
      }

      const { teams, unassignedPlayers }: any = await this.playerService.arrangeFromCSV(
        uploadedFile,
        eventId,
        division,
      );
      const playerIds = [];
      const teamIds = [];
      const promiseOperations = [];
      for (let i = 0; i < teams.length; i += 1) {
        try {
          const teamObj = { ...teams[i] };
          const teamPlayers = [...teams[i].players];
          const playerList = await this.playerService.createMany(teamPlayers);
          const teamPlayerIds = playerList.map((p) => p._id);
          playerIds.push(...teamPlayerIds);
          teamObj.players = teamPlayerIds;
          // teamObj.captain = teamPlayerIds.length > 0 ? teamPlayerIds[0] : null;
          const [createTeam, eventExist] = await Promise.all([
            this.teamService.create(teamObj),
            this.eventService.findById(eventId),
          ]);
          teamIds.push(createTeam._id);

          // ===== Create Ranking =====
          const playerRankings = [];
          for (let i = 0; i < teamPlayerIds.length; i += 1) {
            promiseOperations.push(
              this.playerService.updateOne({ _id: teamPlayerIds[i] }, { $addToSet: { teams: createTeam._id } }),
            );
            // Create player ranking when creating team
            playerRankings.push({ rank: i + 1, player: teamPlayerIds[i] });
          }
          const teamPlayerRanking = await this.playerRankingService.create({
            rankings: playerRankings,
            rankLock: false,
            team: createTeam._id,
          });
          promiseOperations.push(
            this.teamService.updateOne(
              { _id: createTeam._id },
              { $addToSet: { playerRankings: teamPlayerRanking._id } },
            ),
          );

          promiseOperations.push(
            this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $addToSet: { teams: createTeam._id } }),
          );
        } catch (dErrs: any) {
          console.log(dErrs);
        }
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

  async updatePlayer({input, playerId, profile}: UpdatePlayerBody): Promise<PlayerResponse> {
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

  async createPlayer({ input, profile }): Promise<PlayerResponse> {
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

      const playerObj = { ...input, profile: profileUrl, events: [input.event], teams: [] };
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
          for (const pr of playerRankings) {
            const rankings = await this.playerRankingService.findItems({ playerRanking: pr._id });
            const highestRank = rankings.length === 0 ? 0 : Math.max(...rankings.map((p) => p.rank));

            const itemsToInsert = [];
            const playerIds = [...teamExist.players, newPlayer._id];
            let rankIncrement = 0;
            for (let i = 0; i < playerIds.length; i += 1) {
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
            await this.playerRankingService.insertManyItems(itemsToInsert);
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
}
