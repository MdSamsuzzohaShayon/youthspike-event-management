import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { PlayerService } from './player.service';
import { CreatePlayerInput, RankingPlayerInput, UpdatePlayerInput, UpdatePlayersInput } from './player.input';
import { EPlayerStatus, Player } from './player.schema';
import { AppResponse } from 'src/shared/response';
import { Roles } from 'src/shared/auth/roles.decorator';
import { BadRequestException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { User, UserRole } from 'src/user/user.schema';
import { Event } from 'src/event/event.schema';
import { EventService } from 'src/event/event.service';
import { Team } from 'src/team/team.schema';
import { TeamService } from 'src/team/team.service';
import { UserService } from 'src/user/user.service';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { UpdateQuery } from 'mongoose';

@ObjectType()
class PlayerResponse extends AppResponse<Player> {
  @Field((_type) => Player, { nullable: true })
  data?: Player;
}

@ObjectType()
class PlayersResponse extends AppResponse<Player[]> {
  @Field((_type) => [Player], { nullable: true })
  data?: Player[];
}

@Resolver((_of) => Player) // Specify the object type for the resolver
export class PlayerResolver {
  constructor(
    private playerService: PlayerService,
    private eventService: EventService,
    private teamService: TeamService,
    private userService: UserService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => PlayerResponse) // Specify the return type
  async createPlayer(
    @Args('input') input: CreatePlayerInput,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true }) profile?: Upload,
  ) {
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
      if (playerObj.team) delete playerObj.team;
      delete playerObj.event;

      if (playerObj.rank || playerObj.rank === 0) playerObj.rank = null;
      if (input.team) {
        const teamExist = await this.teamService.findById(input.team);
        if (teamExist && teamExist.players) {
          playerObj.rank = teamExist.players.length + 1;
        }
      }

      // ===== Check duplicate email =====
      if (input.email) {
        const duplicateExist = await this.playerService.findOne({ email: input.email });
        if (duplicateExist) {
          return AppResponse.handleError({
            name: 'Duplicate Email',
            statusCode: HttpStatus.NOT_ACCEPTABLE,
            message: 'Use another valid and email in order to change the email',
          });
        }
      }
      const newPlayer = await this.playerService.create(playerObj);

      if (input.team) {
        ensurePromises.push(this.teamService.update({ $addToSet: { players: newPlayer._id } }, { _id: input.team }));
      }
      ensurePromises.push(
        this.eventService.update({ $addToSet: { players: newPlayer._id.toString() } }, input.event.toString()),
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((returns) => PlayerResponse)
  async updatePlayer(
    @Args('input') input: UpdatePlayerInput,
    @Args('playerId') playerId: string,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true })
    profile?: Upload,
  ): Promise<PlayerResponse> {
    try {
      // ===== Upload image to cloudinary =====
      const playerObj: UpdateQuery<Player> = { ...input };
      if (profile) {
        const profileUrl = await this.cloudinaryService.uploadFiles(profile);
        playerObj.profile = profileUrl;
      }

      const playerExist = await this.playerService.findById(playerId);
      if (!playerExist) return AppResponse.notFound('Player');

      const updatePromises = [];
      // ===== Rank Update if a player move from middle of the =====
      if (input?.status && input.playerTeamId) {
        const teamExist = await this.teamService.findById(input.playerTeamId);
        if (!teamExist) return AppResponse.notFound('Team');
        if (input?.status === EPlayerStatus.INACTIVE) {
          playerObj.rank = null;
        } else if (input?.status === EPlayerStatus.ACTIVE) {
          // =====  Check how many active players =====
          playerObj.rank = teamExist.players.length;
        }
      }

      // ===== Move to New Team =====
      if (input.team) {
        const newTeamExist = await this.teamService.findById(input.team);
        if (!newTeamExist) return AppResponse.notFound('Team');
        updatePromises.push(this.teamService.updateOne({ _id: input.team }, { $addToSet: { players: playerId } }));

        // First, add the new team if it doesn't exist
        updatePromises.push(
          this.playerService.updateOne(
            { _id: playerId },
            { $addToSet: { teams: input.team }, $set: { rank: newTeamExist.players.length + 1 } },
          ),
        );
      }

      // ===== Check duplicate email =====
      if (input.email) {
        const duplicateExist = await this.playerService.findOne({ email: input.email });
        if (duplicateExist && duplicateExist.email !== playerExist.email) {
          return AppResponse.handleError({
            name: 'Duplicate Email',
            statusCode: HttpStatus.NOT_ACCEPTABLE,
            message: 'Use another valid and email in order to change the email',
          });
        }
      }

      // ===== Remove from Previous Team =====
      if (input.playerTeamId && input.team) {
        if (input.team === input.playerTeamId)
          return AppResponse.handleError({
            name: 'Invalid team',
            message: 'New team and previous team both are same, therefore no need to change',
          });
        const prevTeamExist = await this.teamService.findById(input.playerTeamId);
        if (!prevTeamExist) return AppResponse.notFound('Team');
        const playerIds = prevTeamExist.players.map((p) => p.toString());
        const newPlayerIds = playerIds.filter((p) => p.toString() !== playerId);
        updatePromises.push(
          this.teamService.updateOne({ _id: input.playerTeamId }, { $set: { players: newPlayerIds } }),
        );
        updatePromises.push(this.teamService.updateOne({ _id: input.playerTeamId }, { $pull: { players: playerId } }));
        // Second, remove the old team
        updatePromises.push(this.playerService.updateOne({ _id: playerId }, { $pull: { teams: input.playerTeamId } }));
      }

      if (playerObj.team) delete playerObj.team;

      if ((playerExist.captainuser || playerExist.cocaptainuser) && (input.firstName || input.lastName)) {
        const userObj: any = {};
        if (input.firstName) userObj.firstName = input.firstName;
        if (input.lastName) userObj.lastName = input.lastName;
        if (playerExist.captainuser) {
          await this.userService.updateOne({ _id: playerExist.captainuser.toString() }, userObj);
        } else if (playerExist.cocaptainuser) {
          await this.userService.updateOne({ _id: playerExist.cocaptainuser.toString() }, userObj);
        }
      }

      if (playerObj.playerTeamId) delete playerObj.playerTeamId;
      if (Object.entries(playerObj).length > 0)
        updatePromises.push(this.playerService.updateOne({ _id: playerId }, playerObj));
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => PlayersResponse)
  async updatePlayers(
    @Args('input', { type: () => [UpdatePlayersInput] }) input: UpdatePlayersInput[],
  ): Promise<PlayersResponse> {
    try {
      let players = [];
      if (input && input.length > 0) {
        const updatePromises = [];
        for (let i = 0; i < input.length; i++) {
          const playerId = input[i]._id;
          const playerObj = { ...input[i] };
          if (playerObj._id) delete playerObj._id;
          updatePromises.push(this.playerService.updateOne({ _id: playerId }, playerObj));
        }
        players = await Promise.all(updatePromises);
      }
      const findPlayers = await this.playerService.query({ _id: { $in: input.map((i) => i._id) } });
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => PlayersResponse)
  async createMultiPlayers(
    @Args('uploadedFile', { type: () => GraphQLUpload, nullable: false }) uploadedFile: Upload,
    @Args('eventId') eventId: string,
    @Args('division') division: string,
  ) {
    /**
     * TODO:
     *    Step-1: Check file type (Validation)
     *    Step-2: Convert it to array of object
     *    Step-3: Create multiple record at once and return
     *    Step-4: Add team if a team is associated with it
     */
    try {
      const allowedFileTypes = ['csv', 'xlsx']; // Add the allowed file types
      const fileExtension = uploadedFile.filename.split('.').pop().toLowerCase();
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
      const updatePlayers = [];
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
          updatePlayers.push(
            this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $addToSet: { teams: createTeam._id } }),
          );
        } catch (dErrs) {
          console.log(dErrs);
        }
      }

      const allPlayers = await this.playerService.createMany(unassignedPlayers);
      await Promise.all(updatePlayers);
      const unassignedPlayerIds = allPlayers.map((p) => p._id);
      playerIds.push(...unassignedPlayerIds);
      await this.eventService.update(
        { $addToSet: { teams: { $each: teamIds }, players: { $each: playerIds } } },
        eventId,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => PlayersResponse)
  async deletePlayer(@Args('playerId', { nullable: false }) playerId: string) {
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
        code: HttpStatus.CREATED,
        success: true,
        message: 'Player has been deleted successfully!',
      };
    } catch (error) {
      console.error('Error in createMultiPlayers:', error);
      // Customize the error response based on the type of error
      return AppResponse.handleError(error);
    }
  }

  @Query((_returns) => PlayerResponse) // Specify the return type
  async getPlayer(@Args('playerId') playerId: string): Promise<PlayerResponse> {
    try {
      const playerExist = await this.playerService.findById(playerId.toString());
      return {
        code: playerExist ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: playerExist ? true : false,
        data: playerExist,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  @Query((_returns) => PlayersResponse) // Specify the return type
  async getPlayers(@Args('eventId') eventId: string): Promise<PlayersResponse> {
    try {
      const players = await this.playerService.query({ events: { $in: [eventId] } });
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of players!',
        data: players,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  /**
   * POPULATE
   * ===============================================================================================
   */
  @ResolveField(() => Event) // Specify the return type
  async events(@Parent() player: Player): Promise<Event[]> {
    try {
      if (!player.events) return [];
      const findEvents = await this.eventService.query({ _id: { $in: player.events } });
      return findEvents;
    } catch (error) {
      return [];
    }
  }
  // Do this for team and net as well
  @ResolveField(() => Team)
  async teams(@Parent() player: Player): Promise<Team[]> {
    try {
      if (!player.teams) return null;
      const findTeams = await this.teamService.query({ _id: { $in: player.teams } });
      return findTeams;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  @ResolveField(() => Team, { nullable: true })
  async captainofteams(@Parent() player: Player): Promise<Team[]> {
    try {
      if (!player.captainofteams) return null;
      const findTeams = await this.teamService.query({ _id: { $in: player.captainofteams } });
      return findTeams;
    } catch (error) {
      return null;
    }
  }

  @ResolveField(() => Team, { nullable: true })
  async cocaptainofteams(@Parent() player: Player): Promise<Team[]> {
    try {
      if (!player.cocaptainofteams) return null;
      const findTeams = await this.teamService.query({ _id: { $in: player.cocaptainofteams } });
      return findTeams;
    } catch (error) {
      return null;
    }
  }

  @ResolveField(() => User, { nullable: true })
  async captainuser(@Parent() player: Player): Promise<User | null> {
    try {
      if (!player.captainuser) return null;
      const findUser = await this.userService.findById(player.captainuser.toString());
      return findUser;
    } catch (error) {
      return null;
    }
  }

  @ResolveField(() => User, { nullable: true })
  async cocaptainuser(@Parent() player: Player): Promise<User | null> {
    try {
      if (!player.cocaptainuser) return null;
      const findUser = await this.userService.findById(player.cocaptainuser.toString());
      return findUser;
    } catch (error) {
      return null;
    }
  }
}
