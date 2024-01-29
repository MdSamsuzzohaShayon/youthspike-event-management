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

    try {
      const players = input.players ? input.players : [];

      const [newTeam, findEvent] = await Promise.all([
        this.teamService.create({
          name: input.name,
          captain: input.captain,
          event: input.event,
          division: input.division,
          active: true,
          players,
          nets: []
        }),
        this.eventService.findById(input.event.toString())
      ]);
      // Captain - User - Player - Team Relationship update
      const promiseOperations = [];
      promiseOperations.push(this.eventService.update({ $push: { teams: newTeam._id } }, input.event));
      for (let i = 0; i < players.length; i += 1) {
        promiseOperations.push(this.playerService.updateOne({ _id: players[i] }, { $push: { teams: newTeam._id }, rank: i + 1 }));
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
          this.playerService.updateOne({ _id: input.captain }, { captainofteam: newTeam._id, captainuser: captainUser._id },),
        );
      }
      await Promise.all(promiseOperations);
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
    const teamExist = await this.teamService.findById(teamId);
    if (!teamExist) return AppResponse.exists("Team");

    const updatePromises = [];

    // Update captain
    if (input.captain) {
      const playerExist = await this.playerService.findById(input.captain.toString());

      if (playerExist && teamExist.captain) {
        const prevCaptain = await this.playerService.findById(teamExist.captain.toString());
        // Make prevCaptain null
        if (input.captain !== teamExist.captain.toString()) {
          updatePromises.push(this.playerService.updateOne({ _id: teamExist.captain.toString() }, { $pull: { captainofteams: teamExist._id.toString() }, captainuser: null }));
          updatePromises.push(this.userService.delete({ $or: [{ email: prevCaptain.email }, { _id: prevCaptain?.captainuser?.toString() }] }));

          // Create new user
          const playerUserExist = await this.userService.findOne({ email: playerExist.email });
          const rawPassword = this.configService.get<string>('PLAYER_PASSWORD');
          const hashedPassword = await bcrypt.hash(rawPassword, 10);
          const userObj = {
            email: playerExist.email, password: hashedPassword,
            firstName: playerExist.firstName, lastName: playerExist.lastName, role: UserRole.captain, captainplayer: playerExist._id, active: true
          }
          let newCaptainUser = null;
          let newCaptainUserId = null;
          if (playerUserExist) {
            newCaptainUser = await this.userService.updateOne({ _id: playerUserExist._id }, userObj);
            newCaptainUserId = playerUserExist._id;
          } else {
            newCaptainUser = await this.userService.create(userObj);
            newCaptainUserId = newCaptainUser._id;
          }
          updatePromises.push(this.playerService.updateOne({ _id: input.captain.toString() }, { $push: { captainofteams: teamId }, captainuser: newCaptainUserId },));
        }
        updatePromises.push(this.teamService.update({ captain: playerExist._id }, { _id: teamId }));
      }
    }
    await Promise.all(updatePromises);
    try {
      return {
        code: 200,
        success: true,
        data: teamExist,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Mutation((resolves) => GetTeamResponse)
  async moveTeam(@Args("eventId") eventId: string, @Args("teamId") teamId: string, @Args("division") division: string) {
    /**
     * Step-1: find team
     * Step-2: 
     */
    try {
      const [eventExist, teamExist] = await Promise.all([
        this.eventService.findById(eventId),
        this.teamService.findById(teamId)
      ]);
      if (!teamExist || !eventExist) return AppResponse.exists('team or event');

      const teamObj: any = teamExist.toJSON();
      delete teamObj._id;
      teamObj.event = eventId;
      teamObj.division = division;


      const newTeam = await this.teamService.create(teamObj);
      const teamPlayersIds = teamExist.players.map((p) => p.toString());
      const eventUpdateObj = { $push: { players: teamPlayersIds, teams: [newTeam._id] }, divisions: eventExist.divisions };
      if (!eventExist.divisions.includes(division)) {
        eventUpdateObj.divisions = eventExist.divisions + ", " + division;
      }
      await Promise.all([
        this.playerService.updateMany({ _id: { $in: teamPlayersIds } }, { $push: { events: eventId } }),
        this.eventService.update(eventUpdateObj, eventId)
      ]);

      return {
        code: 201,
        success: true,
        data: newTeam,
      };
    } catch (error) {
      AppResponse.handleError(error);
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
      const players = await this.playerService.query({ teams: { $in: [team._id.toString()] } });
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
