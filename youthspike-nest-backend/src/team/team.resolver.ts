/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserService } from 'src/user/user.service';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { UserRole } from 'src/user/user.schema';
import { Team } from './team.schema';
import { CreateTeamInput, UpdateTeamInput } from './team.args';
import { Player } from 'src/player/player.schema';
import { PlayerService } from 'src/player/player.service';

@ObjectType()
class CreateOrUpdateTeamResponse extends AppResponse<Team> {
  @Field((type) => Team, { nullable: true })
  data?: Team;
}

@ObjectType()
class GetTeamsResponse extends AppResponse<Team[]> {
  @Field((type) => [Team], { nullable: true })
  data?: Team[];
}

@ObjectType()
class GetTeamResponse extends AppResponse<Team> {
  @Field((type) => Team, { nullable: true })
  data?: Team;
}

@Resolver((of) => Team)
export class TeamResolver {
  constructor(
    private teamService: TeamService,
    private eventService: EventService,
    private playerService: PlayerService,
    private userService: UserService,
  ) {}

  @Mutation((resolves) => CreateOrUpdateTeamResponse)
  async createTeam(@Args('input') input: CreateTeamInput): Promise<CreateOrUpdateTeamResponse> {
    /**
     * TODO:
     *  Step-1: Event team relationship - Update teams in event
     *  Step-2: Team player relationship - Update team in players
     *  Step-3: Team player as captain relationship - Update captain in player
     *  Step-4: Player and user relationship - Create a user with login access as captain of the team
     */
    const players = input.players ? input.players : [];
    const newTeam = await this.teamService.create({
      name: input.name,
      captain: input.captain,
      event: input.event,
      active: true,
      players,
    });

    // Captain - User - Player - Team Relationship update
    const promiseOperations = [];
    promiseOperations.push(this.eventService.update({ teams: [newTeam._id] }, input.event));
    promiseOperations.push(this.playerService.updateMany({ _id: { $in: players } }, { team: newTeam._id }));
    if (input.captain) {
      // Create new user for captain
      const findPlayer = await this.playerService.findById(input.captain.toString());
      const captainDefaultPassword = 'Test1234';
      const captainUser = await this.userService.create({
        firstName: findPlayer.firstName,
        lastName: findPlayer.lastName,
        role: UserRole.captain,
        active: true,
        captainplayer: input.captain,
        login: {
          email: findPlayer.email,
          password: captainDefaultPassword,
        },
      });
      promiseOperations.push(
        this.playerService.update({ captainofteam: newTeam._id, captainuser: captainUser._id }, input.captain),
      );
    }
    await Promise.all(promiseOperations);
    try {
      return {
        code: 201,
        success: true,
        data: newTeam,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Mutation((resolves) => CreateOrUpdateTeamResponse)
  async updateTeam(
    @Args('input') input: UpdateTeamInput,
    @Args('teamId') teamId: string,
  ): Promise<CreateOrUpdateTeamResponse> {
    const teamData = await this.teamService.update(input, { _id: teamId });

    // if (changeEvent) {
    //   await this.teamEventMappingService.delete({
    //     teamId: teamData?._id.toString(),
    //     event: rmCaptainId,
    //     ...(reamoveCoachId?.length > 0 && { userId: reamoveCoachId }),
    //   });
    // }
    // let isPresent;
    // if (reamoveCoachId?.length > 0) {
    //   isPresent = await this.teamEventMappingService.query({
    //     teamId: teamData?._id.toString(),
    //     eventId,
    //     userId: reamoveCoachId,
    //   });
    // } else {
    //   isPresent = await this.teamEventMappingService.query({
    //     teamId: teamData?._id.toString(),
    //     eventId,
    //   });
    // }

    // if (isPresent?.length === 0) {
    //   await this.teamEventMappingService.create(teamData?._id, eventId, coachId);
    // }
    try {
      return {
        code: 200,
        success: true,
        data: teamData,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetTeamsResponse)
  async getTeams(@Args('eventId', { nullable: true }) eventId: string) {
    const teams = await this.teamService.query({ event: eventId.toString() });
    try {
      return {
        code: 200,
        success: true,
        data: teams,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetTeamResponse)
  async getTeam(@Args('teamId') teamId: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.teamService.findById(teamId),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @ResolveField() // Specify the return type for "players"
  async players(@Parent() team: Team): Promise<Player[]> {
    try {
      const players = await this.playerService.query({ team: team._id.toString() });
      return players;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  @ResolveField(() => Player, { nullable: true })
  async captain(@Parent() team: Team) {
    try {
      if (team.captain) {
        const captain = await this.playerService.findById(team.captain.toString());
        return captain || null; // Return null if captain is not found
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  @ResolveField()
  async event(@Parent() team: Team) {
    try {
      const event = await this.eventService.findById(team.event.toString());
      return event;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
