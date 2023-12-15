/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserService } from 'src/user/user.service';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { User, UserRole } from 'src/user/user.schema';
import { Team } from './team.schema';
import { CreateTeamInput, UpdateTeamInput } from './team.args';
import { Player } from 'src/player/player.schema';
import { PlayerService } from 'src/player/player.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { ConfigService } from '@nestjs/config';

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
    private configService: ConfigService
  ) { }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
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

    const [newTeam, findEvent] = await Promise.all([
      this.teamService.create({
        name: input.name,
        captain: input.captain,
        event: input.event,
        active: true,
        players,
      }),
      this.eventService.findById(input.event.toString())
    ]);
    // Captain - User - Player - Team Relationship update
    const promiseOperations = [];
    promiseOperations.push(this.eventService.update({ teams: [newTeam._id] }, input.event));
    for (let i = 0; i < players.length; i += 1) {
      promiseOperations.push(this.playerService.update({ team: newTeam._id, rank: i + 1 }, players[i]));
    }
    if (input.captain) {
      // Create new user for captain
      const findPlayer = await this.playerService.findById(input.captain.toString());
      // const rawPassword = this.configService.get<string>('PLAYER_PASSWORD');
      const rawPassword = findEvent.coachPassword;
      const captainUser = await this.userService.create({
        firstName: findPlayer.firstName,
        lastName: findPlayer.lastName,
        role: UserRole.captain,
        active: true,
        captainplayer: input.captain,
        email: findPlayer.email,
        password: rawPassword,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((resolves) => CreateOrUpdateTeamResponse)
  async updateTeam(
    @Args('input') input: UpdateTeamInput,
    @Args('teamId') teamId: string,
  ): Promise<CreateOrUpdateTeamResponse> {
    /**
     * TODO:
     *  Step-1: Find team, captain and captain user if someone wants to change captain
     *  Step-2: Check prev captain and current is in the same team
     *  Step-3: Create user if there are no user found
     *  Step-4: Update captain, captainuser
     */
    const findTeam = await this.teamService.findById(teamId);
    const updatePromises = [];

    // Update captain
    if (input.captain) {
      const findPlayer = await this.playerService.findById(input.captain.toString());

      if (findPlayer && findTeam.captain && findTeam.captain.toString() !== input.captain.toString()) {
        const prevCaptain = await this.playerService.findById(findTeam.captain.toString());
        updatePromises.push(this.playerService.update({ captainofteam: null, captainuser: null }, findTeam.captain.toString()));
        const prevCaptainuser = await this.userService.findOne({ $or: [{ email: prevCaptain.email }, { _id: prevCaptain?.captainuser?.toString() }] });
        if (prevCaptainuser) {
          updatePromises.push(this.playerService.update({ captainofteam: teamId, captainuser: prevCaptainuser._id }, input.captain.toString()));
          updatePromises.push(this.userService.createOrUpdate({ email: findPlayer.email, captainplayer: findPlayer._id }, prevCaptainuser._id.toString()));
        } else {
          const rawPassword = this.configService.get<string>('PLAYER_PASSWORD');
          const hashedPassword = await bcrypt.hash(rawPassword, 10);
          const newUser = await this.userService.create({
            email: findPlayer.email, password: hashedPassword,
            firstName: findPlayer.firstName, lastName: findPlayer.lastName, role: UserRole.captain, captainplayer: findPlayer._id, active: true
          });
          updatePromises.push(this.playerService.update({ captainofteam: teamId, captainuser: newUser._id }, input.captain.toString()));
        }
        updatePromises.push(this.teamService.update({ captain: findPlayer._id }, { _id: teamId }));
      }
    }
    await Promise.all(updatePromises);
    try {
      return {
        code: 200,
        success: true,
        data: findTeam,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetTeamsResponse)
  async getTeams(@Args('eventId', { nullable: true }) eventId: string) {
    const teams = await this.teamService.find({});
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
