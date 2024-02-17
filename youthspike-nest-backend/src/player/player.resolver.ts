import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { PlayerService } from './player.service';
import { CreatePlayerInput, RankingPlayerInput, UpdatePlayerInput, UpdatePlayersInput } from './player.input';
import { Player } from './player.schema';
import { AppResponse } from 'src/shared/response';
import { Roles } from 'src/shared/auth/roles.decorator';
import { BadRequestException, UseGuards } from '@nestjs/common';
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
    private cloudinaryService: CloudinaryService
  ) { }

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
      if (input.team) playerObj.teams = [input.team];
      if (playerObj.team) delete playerObj.team;
      delete playerObj.event;

      if (playerObj.rank || playerObj.rank === 0) playerObj.rank = null;
      const newPlayer = await this.playerService.create(playerObj);


      if (input.team) {
        ensurePromises.push(this.teamService.update({ $push: { players: newPlayer._id } }, { _id: input.team }))
      }
      ensurePromises.push(this.eventService.update(
        { $push: { players: newPlayer._id.toString() } },
        input.event.toString(),
      ));
      await Promise.all(ensurePromises);

      return {
        success: true,
        code: 201,
        data: newPlayer,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain)
  @Mutation((returns) => PlayerResponse)
  async updatePlayer(@Args('input') input: UpdatePlayerInput, @Args("playerId") playerId: string, @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true })
  profile?: Upload,): Promise<PlayerResponse> {
    try {
      // Upload image to cloudinary
      const playerObj: UpdateQuery<Player> = { ...input };
      if (profile) {
        const profileUrl = await this.cloudinaryService.uploadFiles(profile);
        playerObj.profile = profileUrl
      };

      const [updatedPlayer, playerExist]=await Promise.all([
        this.playerService.updateOne({_id: playerId}, playerObj),
        this.playerService.findById(playerId)
      ])
      return {
        success: true,
        code: 202,
        data: playerExist,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain)
  @Mutation((_returns) => PlayersResponse)
  async updatePlayers(@Args('input', { type: () => [UpdatePlayersInput] }) input: UpdatePlayersInput[]): Promise<PlayersResponse> {
    try {
      let players = [];
      if (input && input.length > 0) {
        const updatePromises = [];
        for (let i = 0; i < input.length; i++) {
          const playerId = input[i]._id;
          const playerObj = { ...input[i] };
          if (playerObj._id) delete playerObj._id;
          updatePromises.push(this.playerService.updateOne({_id: playerId}, playerObj));
        }
        players = await Promise.all(updatePromises);
      }
      const findPlayers = await this.playerService.query({_id: {$in: input.map((i)=> i._id)}});
      return {
        success: true,
        code: 202,
        data: findPlayers,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }


  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => PlayersResponse)
  async createMultiPlayers(
    @Args('uploadedFile', { type: () => GraphQLUpload, nullable: false }) uploadedFile: Upload,
    @Args('eventId') eventId: string,
    @Args('division') division: string
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
      
      const { teams, unassignedPlayers }: any = await this.playerService.arrangeFromCSV(uploadedFile, eventId, division);
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
          teamObj.captain = teamPlayerIds.length > 0 ? teamPlayerIds[0] : null; // 
          const createTeam = await this.teamService.create(teamObj);
          teamIds.push(createTeam._id);
          updatePlayers.push(this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $push: { teams: createTeam._id } }))
        } catch (dErrs) {
          console.log(dErrs);
        }
      }

      const allPlayers = await this.playerService.createMany(unassignedPlayers);
      await Promise.all(updatePlayers);
      const unassignedPlayerIds = allPlayers.map((p) => p._id);
      playerIds.push(...unassignedPlayerIds);
      await this.eventService.update({ $push: { teams: { $each: teamIds }, players: { $each: playerIds } } }, eventId);

      return {
        success: true,
        code: 201,
        data: [], // allPlayers
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
      const player = await this.playerService.findById(playerId.toString());
      return {
        success: true,
        code: 200,
        data: player,
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
        success: true,
        code: 200,
        data: players,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  /**
   * Populate
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
}
