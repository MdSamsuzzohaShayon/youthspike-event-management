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
      if (profile) profileUrl = await this.cloudinaryService.uploadFiles(profile);
      const playerObj = { ...input, profile: profileUrl };
      if (playerObj.rank || playerObj.rank === 0) playerObj.rank = null;
      const newPlayer = await this.playerService.create(playerObj);
      const updateEvent = await this.eventService.update(
        { players: [newPlayer._id.toString()] },
        input.event.toString(),
      );
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
      const playerObj: any = { ...input };
      if (profile) {
        const profileUrl = await this.cloudinaryService.uploadFiles(profile);
        playerObj.profile = profileUrl
      };
      const updatedPlayer = await this.playerService.update(playerObj, playerId);
      return {
        success: true,
        code: 202,
        data: updatedPlayer,
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
          updatePromises.push(this.playerService.update(playerObj, playerId));
        }
        players = await Promise.all(updatePromises);
      }
      return {
        success: true,
        code: 202,
        data: players,
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
    @Args('event') event: string,
  ) {
    /**
     * TODO:
     *    Step-1: Check file type (Validation)
     *    Step-2: Convert it to array of object
     *    Step-3: Create multiple record at once and return
     */
    try {
      const allowedFileTypes = ['csv', 'xlsx']; // Add the allowed file types
      const fileExtension = uploadedFile.filename.split('.').pop().toLowerCase();

      if (!allowedFileTypes.includes(fileExtension)) {
        throw new BadRequestException('Invalid file type. Please upload a CSV or XLSX file.');
      }
      const playersObjList: CreatePlayerInput[] = await this.playerService.arrangeFromCSV(uploadedFile, event);
      const playerList = await this.playerService.createMany(playersObjList);
      const playerIdList = playerList.map((p) => p._id);
      await this.eventService.update({ players: playerIdList }, event);

      return {
        success: true,
        code: 201,
        data: playerList,
      };
    } catch (error) {
      console.error('Error in createMultiPlayers:', error);
      // Customize the error response based on the type of error
      if (error instanceof BadRequestException) {
        // Return a more specific error response for BadRequestException
        throw new BadRequestException('Invalid file: ' + error.message);
      } else {
        // For other types of errors, return a generic error response
        throw new Error('An unexpected error occurred. Please try again.');
      }
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
      const players = await this.playerService.query({ event: eventId });
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
  async event(@Parent() player: Player): Promise<Event | null> {
    try {
      if (!player.event) return null;
      const findEvent = await this.eventService.findById(player.event.toString());
      return findEvent;
    } catch (error) {
      return null;
    }
  }
  // Do this for team and net as well
  @ResolveField(() => Team)
  async team(@Parent() player: Player): Promise<Team | null> {
    try {
      if (!player.team) return null;
      const findTeam = await this.teamService.findById(player.team.toString());
      return findTeam;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  @ResolveField(() => Team, { nullable: true })
  async captainofteam(@Parent() player: Player): Promise<Team | null> {
    try {
      if (!player.captainofteam) return null;
      const findTeam = await this.teamService.findById(player.captainofteam.toString());
      return findTeam;
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
