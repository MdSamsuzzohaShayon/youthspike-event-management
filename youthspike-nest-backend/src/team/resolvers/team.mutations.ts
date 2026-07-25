import { HttpStatus, Injectable } from '@nestjs/common';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { NetService } from 'src/net/net.service';

import { PlayerService } from 'src/player/player.service';
import { AppResponse } from 'src/shared/response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { Team } from '../team.schema';
import { Event } from 'src/event/event.schema';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { CreateTeamInput, UpdateTeamInput, UpdateTeamsInput } from './team.input';
import { CreateOrUpdateTeamResponse, CreateOrUpdateTeamsResponse } from './team.response';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user/user.schema';
import { GroupService } from 'src/group/group.service';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
import { QueryFilter, Types, UpdateQuery } from 'mongoose';
import { CustomTeam } from 'src/team/resolvers/team.response';
import { ConfigService } from '@nestjs/config';
import TeamHelpers from './team.helpers';
import { BadgeService } from 'src/badge/badge.service';
const GraphQLUpload = GraphQLUploadModule.default;

type ObjectIdLike = Types.ObjectId | string;

@Injectable()
export class TeamMutations {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private cloudinaryService: CloudinaryService,
    private userService: UserService,
    private matchService: TeamService,
    private groupService: GroupService,
    private playerService: PlayerService,
    private playerRankingService: PlayerRankingService,
    private badgeService: BadgeService,

    private readonly teamHelpers: TeamHelpers
  ) { }


  async createTeam(
    input: CreateTeamInput,
    logo?: Promise<FileUpload>,
  ): Promise<CreateOrUpdateTeamResponse> {
    try {
      const players = input.players ? input.players : [];

      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);

      const teamExist = await this.teamService.findOne({ name: input.name, events: { $in: input.events } });
      if (teamExist) {
        return AppResponse.handleError({
          code: 404,
          success: false,
          message: 'There is already a team exist with this name in this event!',
        });
      }

      const newTeam = await this.teamService.create({ ...input, logo: logoUrl });
      const postCreateTasks = [];
      
      if (input.badge) {
        postCreateTasks.push(
          this.badgeService.updateOne({ _id: input.badge }, { $addToSet: { teams: newTeam._id } }),
        );
      }

      // ===== Captain - User - Player - Team Relationship update =====
      postCreateTasks.push(this.eventService.updateMany({ _id: { $in: input.events } }, { $addToSet: { teams: newTeam._id } }));

      // Create player ranking when creating match
      const playerRankings = [];
      for (let i = 0; i < players.length; i += 1) {
        postCreateTasks.push(this.playerService.updateOne({ _id: players[i] }, { $push: { teams: newTeam._id } }));
        // Create player ranking when creating team
        playerRankings.push({ rank: i + 1, player: players[i] });
      }
      const teamPlayerRanking = await this.playerRankingService.create({
        rankings: playerRankings,
        rankLock: false,
        team: newTeam._id,
      });
      postCreateTasks.push(
        this.teamService.updateOne({ _id: newTeam._id }, { $addToSet: { playerRankings: teamPlayerRanking._id } }),
      );

      if (input.captain) {
        // =====  Create new user for captain =====
        const findPlayer = await this.playerService.findById(input.captain.toString());
        // const username = findPlayer.firstName.toLowerCase() + newTeam.num.toString();
        const username = findPlayer?.username ?? this.playerService.playerUsername(findPlayer.username);
        postCreateTasks.push(this.playerService.updateOne({ _id: input.captain.toString() }, { $set: { username } }));
        const rawPassword = this.configService.get('DEFAULT_CAPTAIN_PASSWORD')
        const captainUser = await this.userService.create({
          firstName: findPlayer.firstName,
          lastName: findPlayer.lastName,
          role: UserRole.captain,
          active: true,
          captainplayer: input.captain,
          email: username,
          password: rawPassword,
        });
        postCreateTasks.push(
          this.playerService.updateOne(
            { _id: input.captain },
            {
              $addToSet: { captainofteams: newTeam._id }, // Add push
              captainuser: captainUser._id,
            },
          ),
        );
      }

      if (input.groups) {
        postCreateTasks.push(
          this.groupService.updateMany({ _id: { $in: input.groups } }, { $addToSet: { teams: newTeam._id } }),
        );
      }

      const [createdTeam, ...promises] = await Promise.all([
        this.teamService.findOne({ _id: newTeam._id }),
        ...postCreateTasks
      ]);


      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'A team has been created successfully',
        data: createdTeam as CustomTeam,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async updateTeam(
    input: UpdateTeamInput,
    teamId: string,
    logo?: Promise<FileUpload>,
  ): Promise<CreateOrUpdateTeamResponse> {
    try {
      const existingTeam = await this.teamService.findById(teamId);
      if (!existingTeam) return AppResponse.notFound('Team');

      const teamEvents = await this.eventService.find({ _id: { $in: existingTeam.events as string[] } });
      if (!teamEvents || teamEvents.length === 0) return AppResponse.notFound('Event');

      const preUpdateTasks = [];
      if (input.badge) {
        if (!existingTeam.badge) {
          preUpdateTasks.push(this.badgeService.updateOne({ _id: input.badge }, { $addToSet: { teams: teamId } }));
        } else {
          if (String(existingTeam.badge) !== input.badge) {
            preUpdateTasks.push(this.badgeService.updateOne({ _id: existingTeam.badge }, { $pull: { teams: teamId } }));
            preUpdateTasks.push(this.badgeService.updateOne({ _id: input.badge }, { $addToSet: { teams: teamId } }));
          }
        }
      }

      await Promise.all(preUpdateTasks);

      const updatedTeam = await this.teamHelpers.singleTeamUpdate(input, existingTeam, teamEvents, logo);
      if (!updatedTeam) return AppResponse.notFound('Team');

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A team has been updated successfully',
        data: {
          ...updatedTeam,
          groups: this.teamHelpers.sanitizeTeamGroups(updatedTeam),
        } as CustomTeam,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async updateTeams(
    input: UpdateTeamsInput,
    eventId: string,
    logo?: Promise<FileUpload>,
  ): Promise<CreateOrUpdateTeamsResponse> {
    try {
      const teamIds = new Set(input.teamIds.filter((team) => team));
      if (!teamIds || teamIds.size === 0) return AppResponse.notFound('Teams');
      const [teams, eventExist] = await Promise.all([
        this.teamService.find({ _id: { $in: [...teamIds] } }),
        this.eventService.findById(eventId),
      ]);
      if (!teams || teams.length === 0) return AppResponse.notFound('Teams');
      if (!eventExist) return AppResponse.notFound('Event');

      const updatePromises = [];
      for (const team of teams) {
        const eventIds = (team.events as string[]).filter(
          (id) => id && Types.ObjectId.isValid(id)
        );
        const events = await this.eventService.find({ _id: { $in: eventIds as string[] } });
        updatePromises.push(this.teamHelpers.singleTeamUpdate(input, team, events, logo));
      }

      const updatedTeams = await Promise.all(updatePromises);;
      if (!updatedTeams) {
        return AppResponse.notFound('Team');
      }

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A team has been updated successfully',
        data: updatedTeams,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  async deleteTeam(teamId: string): Promise<CreateOrUpdateTeamResponse> {
    try {
      const teamExist = await this.teamService.findById(teamId);
      if (!teamExist) return AppResponse.notFound('Team');
      await this.teamHelpers.singleDelete(teamExist);
      return {
        code: HttpStatus.NO_CONTENT,
        success: true,
        message: 'A team has been deleted successfully',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  async deleteTeams(teamIds: string[]): Promise<CreateOrUpdateTeamResponse> {
    try {
      const deletePromises = [];
      for (let i = 0; i < teamIds.length; i++) {
        try {
          const teamExist = await this.teamService.findById(teamIds[i]);
          if (!teamExist) {
            continue;
          }
          if (teamExist.captain) {
            deletePromises.push(
              this.playerService.updateOne(
                { _id: teamExist.captain.toString() },
                { $pull: { teams: teamExist._id.toString() } },
              ),
            );
          }

          if (teamExist.cocaptain) {
            deletePromises.push(
              this.playerService.updateOne(
                { _id: teamExist.cocaptain.toString() },
                { $pull: { teams: teamExist._id.toString() } },
              ),
            );
          }
          if (teamExist.matches && teamExist.matches.length > 0) {
            // this.matchService.updateMany({ _id: { $in: teamExist.matches } }, { $set: { teamA: null } });
          }

          if (teamExist.events) {
            deletePromises.push(
              this.eventService.updateOne({ _id: teamExist.events.toString() }, { $pull: { teams: teamExist._id } }),
            );
          }

          if (teamExist.players && teamExist.players.length > 0) {
            deletePromises.push(
              this.playerService.updateMany(
                { _id: { $in: teamExist.players.map(p => String(p)) } },
                { $pull: { teams: teamExist._id.toString() } },
              ),
            );
          }


          if (teamExist.groups) {
            deletePromises.push(
              this.groupService.updateOne({ _id: { $in: teamExist.groups as string[] } }, { $pull: { teams: teamExist._id.toString() } }),
            );
          }

          if (teamExist.playerRankings && teamExist.playerRankings.length > 0) {
            const playerRankings = await this.playerRankingService.find({ _id: { $in: teamExist.playerRankings.map(p => String(p)) } });
            for (const pr of playerRankings) {
              deletePromises.push(this.playerRankingService.deleteManyItem({ _id: { $in: pr.rankings.map(p => String(p)) } }));
            }
            deletePromises.push(this.playerRankingService.deleteMany({ _id: { $in: teamExist.playerRankings.map(p => String(p)) } }));
          }
          if (teamExist) {
            deletePromises.push(this.teamHelpers.singleDelete(teamExist));
          }
        } catch (dltErr) {
          console.log(dltErr);
        }
      }

      await Promise.all(deletePromises);

      return {
        code: HttpStatus.NO_CONTENT,
        data: null,
        success: true,
        message: 'Teams have been deleted successfully',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

}
