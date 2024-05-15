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
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { ConfigService } from '@nestjs/config';
import { Event } from 'src/event/event.schema';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { UpdateQuery } from 'mongoose';
import { NetService } from 'src/net/net.service';
import { MatchService } from 'src/match/match.service';

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
    private cloudinaryService: CloudinaryService,
    private netService: NetService,
    private matchService: MatchService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((resolves) => CreateOrUpdateTeamResponse)
  async createTeam(
    @Args('input') input: CreateTeamInput,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true })
    logo?: Upload,
  ): Promise<CreateOrUpdateTeamResponse> {
    try {
      const players = input.players ? input.players : [];

      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);

      const [newTeam, findEvent] = await Promise.all([
        this.teamService.create({
          name: input.name,
          logo: logoUrl,
          sendCredentials: false,
          captain: input.captain,
          event: input.event,
          division: input.division.trim().toLowerCase(),
          rankLock: false,
          active: true,
          players,
          nets: [],
        }),
        this.eventService.findById(input.event.toString()),
      ]);

      // ===== Captain - User - Player - Team Relationship update =====
      const promiseOperations = [];
      promiseOperations.push(this.eventService.update({ $push: { teams: newTeam._id } }, input.event));
      for (let i = 0; i < players.length; i += 1) {
        promiseOperations.push(
          this.playerService.updateOne({ _id: players[i] }, { $push: { teams: newTeam._id }, rank: i + 1 }),
        );
      }

      if (input.captain) {
        // =====  Create new user for captain =====
        const findPlayer = await this.playerService.findById(input.captain.toString());
        const username = findPlayer.firstName.toLowerCase() + newTeam.num;
        promiseOperations.push(this.playerService.updateOne({ _id: input.captain.toString() }, { $set: { username } }));
        const rawPassword = findEvent.coachPassword;
        const captainUser = await this.userService.create({
          firstName: findPlayer.firstName,
          lastName: findPlayer.lastName,
          role: UserRole.captain,
          active: true,
          captainplayer: input.captain,
          email: username,
          password: rawPassword,
        });
        promiseOperations.push(
          this.playerService.updateOne(
            { _id: input.captain },
            {
              $addToSet: { captainofteams: newTeam._id }, // Add push
              captainuser: captainUser._id,
            },
          ),
        );
      }

      await Promise.all(promiseOperations);
      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'A team has been created successfully',
        data: newTeam,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((resolves) => CreateOrUpdateTeamResponse)
  async updateTeam(
    @Args('input') input: UpdateTeamInput,
    @Args('teamId') teamId: string,
    @Args('eventId') eventId: string,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true })
    logo?: Upload,
  ): Promise<CreateOrUpdateTeamResponse> {
    try {
      const [teamExist, eventExist] = await Promise.all([
        this.teamService.findById(teamId),
        this.eventService.findById(eventId),
      ]);
      if (!teamExist) return AppResponse.notFound('Team');
      if (!eventExist) return AppResponse.notFound('Event');

      const updatePromises = [];
      const teamObj: any = { ...input };
      if (teamObj.division) teamObj.division = teamObj.division.toString().trim().toLowerCase();

      // ===== Update captain =====
      if (input.captain) {
        const playerExist = await this.playerService.findById(input.captain.toString());

        if (playerExist) {
          const newUsername =
            playerExist?.username?.toLowerCase() + teamExist.num || playerExist.firstName.toLowerCase() + teamExist.num;
          const playerUserExist = await this.userService.findOne({ email: playerExist.username });
          const createOrUpdatePlayer = await this.userService.createCapUser(
            playerExist,
            playerUserExist,
            eventExist,
            newUsername,
            UserRole.captain,
          );
          const newCaptainUserId = createOrUpdatePlayer._id;

          if (teamExist.captain) {
            // =====  Make prevCaptain null =====
            const prevCaptain = await this.playerService.findById(teamExist.captain.toString());
            if (input.captain !== teamExist.captain.toString()) {
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: teamExist.captain.toString() },
                  { $pull: { captainofteams: teamExist._id.toString() }, captainuser: null, newUsername: null },
                ),
              );
              updatePromises.push(this.userService.deleteOne({ _id: prevCaptain?.captainuser?.toString() }));
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: input.captain.toString() },
                  { $push: { captainofteams: teamId }, captainuser: newCaptainUserId, username: newUsername },
                ),
              );
            }
          } else {
            updatePromises.push(
              this.playerService.updateOne(
                { _id: input.captain.toString() },
                { $push: { captainofteams: teamId }, captainuser: newCaptainUserId, username: newUsername },
              ),
            );
          }
          teamObj.captain = playerExist._id;
        }
      }

      // ===== Update co-captain
      if (input.cocaptain) {
        const playerExist = await this.playerService.findById(input.cocaptain.toString());
        if (playerExist) {
          const playerUserExist = await this.userService.findOne({ email: playerExist.username });
          const newUsername = playerExist.firstName.toLowerCase() + teamExist.num;
          const createOrUpdatePlayer = await this.userService.createCapUser(
            playerExist,
            playerUserExist,
            eventExist,
            newUsername,
            UserRole.co_captain,
          );
          const newCaptainUserId = createOrUpdatePlayer._id;

          if (teamExist.cocaptain) {
            // ===== make prev co captain null =====
            const prevCaptain = await this.playerService.findById(teamExist.cocaptain.toString());
            if (input.cocaptain !== teamExist.cocaptain.toString()) {
              // Update previous player
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: teamExist.cocaptain.toString() },
                  { $pull: { cocaptainofteams: teamExist._id.toString() }, cocaptainuser: null, username: null },
                ),
              );
              // Delete previous user
              updatePromises.push(this.userService.deleteOne({ _id: prevCaptain?.cocaptainuser?.toString() }));
              // Update new player
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: input.cocaptain.toString() },
                  { $push: { cocaptainofteams: teamId }, cocaptainuser: newCaptainUserId, username: newUsername },
                ),
              );
            }
          } else {
            updatePromises.push(
              this.playerService.updateOne(
                { _id: input.cocaptain.toString() },
                { $push: { cocaptainofteams: teamId }, cocaptainuser: newCaptainUserId, username: newUsername },
              ),
            );
          }
          teamObj.cocaptain = playerExist._id;
        }
      }

      // =====  Update Logo =====
      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);
      if (logoUrl) teamObj.logo = logoUrl;

      // =====  Update players =====
      const players = input.players ? input.players : [];
      const prevPlayerIds = teamExist.players.map((pId) => pId.toString());
      for (let i = 0; i < players.length; i += 1) {
        updatePromises.push(
          this.playerService.updateOne(
            { _id: players[i] },
            { $addToSet: { teams: teamExist._id }, rank: prevPlayerIds.length + i + 1 },
          ),
        );
      }
      teamObj.players = [...new Set([...prevPlayerIds, ...players])];

      updatePromises.push(this.teamService.update(teamObj, { _id: teamId }));

      await Promise.all(updatePromises);
      const updatedTeam = await this.teamService.findById(teamId);
      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A team has been updated successfully',
        data: updatedTeam,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Mutation((resolves) => GetTeamResponse)
  async moveTeam(@Args('eventId') eventId: string, @Args('teamId') teamId: string, @Args('division') division: string) {
    try {
      const [eventExist, teamExist] = await Promise.all([
        this.eventService.findById(eventId),
        this.teamService.findById(teamId),
      ]);
      if (!teamExist || !eventExist) return AppResponse.notFound('team or event');

      const teamObj: any = teamExist.toJSON();
      delete teamObj._id;
      teamObj.event = eventId;
      teamObj.division = division;

      const newTeam = await this.teamService.create(teamObj);
      const teamPlayersIds = teamExist.players.map((p) => p.toString());
      const eventUpdateObj = {
        $push: { players: teamPlayersIds, teams: [newTeam._id] },
        divisions: eventExist.divisions,
      };
      if (!eventExist.divisions.includes(division)) {
        eventUpdateObj.divisions = eventExist.divisions + ', ' + division;
      }
      await Promise.all([
        this.playerService.updateMany({ _id: { $in: teamPlayersIds } }, { $push: { events: eventId } }),
        this.eventService.update(eventUpdateObj, eventId),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'A team has been moved successfully',
        data: newTeam,
      };
    } catch (error) {
      AppResponse.handleError(error);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((resolves) => CreateOrUpdateTeamResponse)
  async deleteTeam(@Args('teamId') teamId: string): Promise<CreateOrUpdateTeamResponse> {
    try {
      const teamExist = await this.teamService.findById(teamId);
      if (!teamExist) return AppResponse.notFound('Team');

      const teamPlayerIds = teamExist.players.map((p) => p.toString());
      const teamNetIds = teamExist.nets.map((n) => n.toString());
      const teamMatchIds = teamExist.matches.map((m) => m.toString());

      const updatePromises = [];
      updatePromises.push(
        this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $pull: { team: teamPlayerIds } }),
      );
      updatePromises.push(this.netService.delete({ _id: { $in: teamNetIds } }));
      if (teamExist.captain)
        updatePromises.push(this.playerService.updateOne({ _d: teamExist.captain }, { $pull: { teams: teamId } }));
      if (teamExist.cocaptain)
        updatePromises.push(this.playerService.updateOne({ _d: teamExist.cocaptain }, { $pull: { teams: teamId } }));
      if (teamMatchIds.length > 0)
        updatePromises.push(
          this.matchService.updateMany({ _id: { $in: teamMatchIds } }, { $set: { teamA: null, teamB: null } }),
        );
      updatePromises.push(this.teamService.delete({ _id: teamId }));
      await Promise.all(updatePromises);
      return {
        code: HttpStatus.NO_CONTENT,
        success: true,
        message: 'A team has been deleted successfully',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetTeamsResponse)
  async getTeams(@Args('eventId', { nullable: true }) eventId: string) {
    try {
      const teams = await this.teamService.find({ event: eventId });
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of teams!',
        data: teams,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetTeamResponse)
  async getTeam(@Args('teamId') teamId: string) {
    const teamExist = await this.teamService.findById(teamId);
    if (!teamExist) return AppResponse.notFound('Team');
    try {
      return {
        code: HttpStatus.OK,
        success: true,
        data: teamExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  /**
   * POPULATE
   * ===============================================================================================
   */

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

  @ResolveField(() => Player, { nullable: true })
  async cocaptain(@Parent() team: Team) {
    try {
      if (team.cocaptain) {
        const cocaptain = await this.playerService.findById(team.cocaptain.toString());
        return cocaptain || null; // Return null if cocaptain is not found
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
