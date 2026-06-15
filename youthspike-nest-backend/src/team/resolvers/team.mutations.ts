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
  ) { }



  /** Extracts a string id from either a raw ObjectId/string or a populated document. */
  private toIdString(value: unknown): string {
    if (value && typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
      return String((value as { _id: unknown })._id);
    }
    return String(value);
  }

  /** Normalizes a division name for consistent storage/comparison. */
  private normalizeDivisionName(division: string): string {
    return division.toString().trim().toLowerCase();
  }

  /**
   * Given the team's current groups and the desired list of group ids,
   * returns which groups the team should be removed from and added to.
   */
  private computeGroupMembershipChanges(
    currentGroups: unknown[],
    desiredGroupIds: string[],
  ): { groupsToLeave: string[]; groupsToJoin: string[] } {
    const desiredGroupIdSet = new Set(desiredGroupIds);
    const currentGroupIds = currentGroups.map((group) => this.toIdString(group));
    const groupsToLeave = currentGroupIds.filter((groupId) => !desiredGroupIdSet.has(groupId));

    return { groupsToLeave, groupsToJoin: desiredGroupIds };
  }

  /** Merges existing and incoming player ids into a deduplicated list of string ids. */
  private mergeUniquePlayerIds(existingPlayerIds: ObjectIdLike[], incomingPlayerIds: ObjectIdLike[]): string[] {
    const merged = new Set<string>();
    existingPlayerIds.forEach((id) => merged.add(this.toIdString(id)));
    incomingPlayerIds.forEach((id) => merged.add(this.toIdString(id)));
    return Array.from(merged);
  }

  /** Returns a team's group ids with any null/undefined populate gaps removed. */
  private sanitizeTeamGroups(team: Team): string[] {
    if (!team.groups?.length) return [];
    return team.groups.filter(Boolean).map((group) => this.toIdString(group));
  }

  /**
   * Removes a player's previous captain/co-captain role and deletes the
   * associated user account that was created for that role.
   */
  private async removePreviousTeamLeader(
    previousLeaderId: string,
    teamId: string,
    leaderType: 'captain' | 'cocaptain',
    updatePromises: Promise<unknown>[],
  ): Promise<void> {
    const previousPlayer = await this.playerService.findById(previousLeaderId);

    const teamsField = leaderType === 'captain' ? 'captainofteams' : 'cocaptainofteams';
    const userIdField = leaderType === 'captain' ? 'captainuser' : 'cocaptainuser';

    // NOTE: $pull and field assignments must be combined under $set —
    // mixing a raw field with a $-operator at the top level is invalid for mongoose updates.
    updatePromises.push(
      this.playerService.updateOne(
        { _id: previousLeaderId },
        {
          $pull: { [teamsField]: teamId },
          $set: { [userIdField]: null, username: null },
        },
      ),
    );

    const userToDeleteId = previousPlayer?.[userIdField];
    if (userToDeleteId) {
      updatePromises.push(this.userService.deleteOne({ _id: userToDeleteId.toString() }));
    }
  }

  /** Assigns a player as the new captain/co-captain of a team. */
  private assignNewTeamLeader(
    newLeaderId: string,
    teamId: string,
    leaderType: 'captain' | 'cocaptain',
    newUsername: string,
    newUserId: ObjectIdLike,
    updatePromises: Promise<unknown>[],
  ): void {
    const teamsField = leaderType === 'captain' ? 'captainofteams' : 'cocaptainofteams';
    const userIdField = leaderType === 'captain' ? 'captainuser' : 'cocaptainuser';

    updatePromises.push(
      this.playerService.updateOne(
        { _id: newLeaderId },
        {
          $addToSet: { [teamsField]: teamId },
          $set: { [userIdField]: newUserId, username: newUsername },
        },
      ),
    );
  }

  /**
   * Handles a full captain/co-captain reassignment: creates the new leader's
   * user account, cleans up the previous leader (if changed), assigns the new
   * leader, and stages the team document update.
   */
  private async updateTeamLeaderRole(
    team: Team,
    teamId: string,
    leaderType: 'captain' | 'cocaptain',
    newLeaderId: string | undefined,
    events: Event[],
    updatePromises: Promise<unknown>[],
    teamUpdate: UpdateQuery<Team>,
  ): Promise<void> {
    if (!newLeaderId) return;

    const newLeader = await this.playerService.findById(newLeaderId);
    if (!newLeader) return;

    const previousLeaderId = team[leaderType]?.toString();
    const newUsername = newLeader.username ?? this.playerService.playerUsername(newLeader.firstName);
    const existingUser = await this.userService.findOne({ email: newLeader.username });

    // For player/captain/co-captain we should select the player's event;
    // temporarily defaulting to the team's first known event.
    const createdUser = await this.userService.createCapUser(
      newLeader,
      existingUser,
      events[0],
      newUsername,
      leaderType === 'captain' ? UserRole.captain : UserRole.co_captain,
    );

    if (previousLeaderId && previousLeaderId !== newLeaderId) {
      await this.removePreviousTeamLeader(previousLeaderId, teamId, leaderType, updatePromises);
    }

    this.assignNewTeamLeader(newLeaderId, teamId, leaderType, newUsername, createdUser._id, updatePromises);

    teamUpdate[leaderType] = newLeader._id;
  }

  /**
   * Adds any newly-joined players to every non-locked player ranking of a team,
   * appending them after the current highest rank.
   */
  private async addNewPlayersToTeamRankings(teamId: string, allPlayerIds: string[]): Promise<void> {
    const playerRankings = await this.playerRankingService.find({ team: teamId, rankLock: false });
    if (playerRankings.length === 0) return;

    await Promise.all(
      playerRankings.map(async (ranking) => {
        const existingItems = await this.playerRankingService.findItems({ playerRanking: ranking._id });
        const existingPlayerIds = new Set(existingItems.map((item) => item.player.toString()));
        const highestRank = existingItems.length > 0 ? Math.max(...existingItems.map((item) => item.rank)) : 0;

        const newPlayerIds = allPlayerIds.filter((playerId) => !existingPlayerIds.has(playerId));
        if (newPlayerIds.length === 0) return;

        const itemsToInsert = newPlayerIds.map((playerId, index) => ({
          player: playerId,
          rank: highestRank + index + 1,
          playerRanking: ranking._id,
        }));

        const insertedItems = await this.playerRankingService.insertManyItems(itemsToInsert);
        await this.playerRankingService.updateOne(
          { _id: ranking._id },
          { $addToSet: { rankings: { $each: insertedItems.map((item) => item._id.toString()) } } },
        );
      }),
    );
  }



  async singleTeamUpdate(
    input: UpdateTeamInput,
    team: Team,
    events: Event[],
    logo?: Promise<FileUpload>,
  ): Promise<Team | null> {
    const teamId = team._id.toString();
    const updatePromises: Promise<unknown>[] = [];
    const teamUpdate: UpdateQuery<Team> = { ...input };

    // ===== Division =====
    if (input.division) {
      const division = this.normalizeDivisionName(input.division);
      teamUpdate.division = division;
      updatePromises.push(this.playerService.updateMany({ teams: { $in: [teamId] } }, { $set: { division } }));
    }

    // ===== Groups =====
    if (input.groups) {
      const { groupsToLeave, groupsToJoin } = this.computeGroupMembershipChanges(team.groups ?? [], input.groups);

      if (groupsToLeave.length > 0) {
        updatePromises.push(
          this.groupService.updateMany({ _id: { $in: groupsToLeave } }, { $pull: { teams: teamId } }),
        );
      }
      if (groupsToJoin.length > 0) {
        updatePromises.push(
          this.groupService.updateMany({ _id: { $in: groupsToJoin } }, { $addToSet: { teams: teamId } }),
        );
      }
    }

    // ===== Captain & co-captain =====
    await this.updateTeamLeaderRole(team, teamId, 'captain', input.captain?.toString(), events, updatePromises, teamUpdate);
    await this.updateTeamLeaderRole(team, teamId, 'cocaptain', input.cocaptain?.toString(), events, updatePromises, teamUpdate);

    // ===== Logo =====
    if (logo) {
      const logoUrl = await this.cloudinaryService.uploadFiles(logo);
      if (logoUrl) teamUpdate.logo = logoUrl;
    }

    // ===== Events =====
    if (input.events && input.events.length > 0) {
      // NOTE: this links the team's *current* events to itself (team.events),
      // not the newly-supplied input.events. Kept as-is to preserve existing
      // behavior — flag for review if input.events was meant to be the target list.
      updatePromises.push(
        this.eventService.updateMany({ _id: { $in: team.events as string[] } }, { $addToSet: { teams: teamId } }),
      );
    }

    // ===== Players =====

    const incomingPlayerIds = (input.players ?? []) as ObjectIdLike[];
    const existingPlayerIds = (team.players ?? []) as ObjectIdLike[];

    const allPlayerIds = this.mergeUniquePlayerIds(existingPlayerIds, incomingPlayerIds);

    if (incomingPlayerIds.length > 0) {
      updatePromises.push(
        this.playerService.updateMany(
          { _id: { $in: incomingPlayerIds.map((id) => this.toIdString(id)) } },
          { $addToSet: { teams: teamId } },
        ),
      );
    }
    teamUpdate.players = allPlayerIds;

    // ===== Persist team document =====
    updatePromises.push(this.teamService.updateOne({ _id: teamId }, teamUpdate));

    // ===== Player rankings =====
    updatePromises.push(this.addNewPlayersToTeamRankings(teamId, allPlayerIds));

    await Promise.all(updatePromises);
    return this.teamService.findById(teamId);
  }

  async singleDelete(teamExist: Team) {
    const teamPlayerIds = teamExist.players.map((p) => p.toString());
    const teamMatchIds = teamExist.matches.map((m) => m.toString());

    const updatePromises = [];
    // remove team 

    const playerRankings = await this.playerRankingService.find({ team: teamExist._id });
    for (const playerRanking of playerRankings) {
      updatePromises.push(this.playerRankingService.deleteManyItem({ playerRanking: playerRanking._id }));
    }
    // Delete player ranking and player ranking item
    updatePromises.push(this.playerRankingService.deleteMany({ team: teamExist._id }));


    // Remove team from player
    updatePromises.push(
      this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $pull: { teams: teamExist._id } }),
    );

    // Remove prevteams from players
    updatePromises.push(this.playerService.updateOne({ prevteams: teamExist._id }, { $pull: { prevteams: teamExist._id } }));

    // Remove captain from players
    if (teamExist.captain) {
      updatePromises.push(this.playerService.updateOne({ _id: teamExist.captain }, { $pull: { captainofteams: teamExist._id } }));
    }


    // Remove co captain from players
    if (teamExist.cocaptain) {
      updatePromises.push(
        this.playerService.updateOne({ _id: teamExist.cocaptain }, { $pull: { cocaptainofteams: teamExist._id } }),
      );
    }

    // Remove team from events
    if (teamExist.events.length > 0) {
      updatePromises.push(this.eventService.updateMany({ _id: { $in: [...teamExist.events as string[]] } }, { $pull: { teams: teamExist._id } }));
    }

    // Remove matches of the team
    if (teamMatchIds.length > 0)
      updatePromises.push(
        this.matchService.updateMany({ _id: { $in: teamMatchIds } }, { $set: { teamA: null, teamB: null } }),
      );
    updatePromises.push(this.teamService.deleteMany({ _id: teamExist._id }));
    await Promise.all(updatePromises);
  }

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

      // ===== Captain - User - Player - Team Relationship update =====
      const promiseOperations = [];
      promiseOperations.push(this.eventService.updateMany({ _id: { $in: input.events } }, { $addToSet: { teams: newTeam._id } }));

      // Create player ranking when creating match
      const playerRankings = [];
      for (let i = 0; i < players.length; i += 1) {
        promiseOperations.push(this.playerService.updateOne({ _id: players[i] }, { $push: { teams: newTeam._id } }));
        // Create player ranking when creating team
        playerRankings.push({ rank: i + 1, player: players[i] });
      }
      const teamPlayerRanking = await this.playerRankingService.create({
        rankings: playerRankings,
        rankLock: false,
        team: newTeam._id,
      });
      promiseOperations.push(
        this.teamService.updateOne({ _id: newTeam._id }, { $addToSet: { playerRankings: teamPlayerRanking._id } }),
      );

      if (input.captain) {
        // =====  Create new user for captain =====
        const findPlayer = await this.playerService.findById(input.captain.toString());
        // const username = findPlayer.firstName.toLowerCase() + newTeam.num.toString();
        const username = findPlayer?.username ?? this.playerService.playerUsername(findPlayer.username);
        promiseOperations.push(this.playerService.updateOne({ _id: input.captain.toString() }, { $set: { username } }));
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

      if (input.groups) {
        promiseOperations.push(
          this.groupService.updateMany({ _id: { $in: input.groups } }, { $addToSet: { teams: newTeam._id } }),
        );
      }

      const [createdTeam, ...promises] = await Promise.all([
        this.teamService.findOne({ _id: newTeam._id }),
        ...promiseOperations
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

      const updatedTeam = await this.singleTeamUpdate(input, existingTeam, teamEvents, logo);
      if (!updatedTeam) return AppResponse.notFound('Team');

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A team has been updated successfully',
        data: {
          ...updatedTeam,
          groups: this.sanitizeTeamGroups(updatedTeam),
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
      const [teamsExist, eventExist] = await Promise.all([
        this.teamService.find({ _id: { $in: input.teamIds } }),
        this.eventService.findById(eventId),
      ]);
      if (!teamsExist || teamsExist.length === 0) return AppResponse.notFound('Team');
      if (!eventExist) return AppResponse.notFound('Event');

      const updatePromises = [];
      for (const team of teamsExist) {
        // updatePromises.push(this.singleTeamUpdate(input, team, eventExist, logo));
      }

      const updatedTeams = await Promise.all(updatePromises);;
      if (!updatedTeams) {
        return AppResponse.notFound('Team');
      }

      // Convert Team to CustomTeam format

      const customTeams = [];
      for (const team of updatedTeams) {
        const customTeam = {
          ...team,
          matches: (team.matches || []).map((m: any) => m?.toString?.() || String(m)),
          nets: (team.nets || []).map((n: any) => n?.toString?.() || String(n)),
          players: (team.players || []).map((p: any) => p?.toString?.() || String(p)),
          captain: team.captain ? String(team.captain) : undefined,
          cocaptain: team.cocaptain ? String(team.cocaptain) : undefined,
          group: team.group ? String(team.group) : undefined,
        };
        customTeams.push(customTeam);

      }

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A team has been updated successfully',
        data: customTeams,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  async deleteTeam(teamId: string): Promise<CreateOrUpdateTeamResponse> {
    try {
      const teamExist = await this.teamService.findById(teamId);
      if (!teamExist) return AppResponse.notFound('Team');
      await this.singleDelete(teamExist);
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
            deletePromises.push(this.singleDelete(teamExist));
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
