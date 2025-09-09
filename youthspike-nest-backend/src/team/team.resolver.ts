/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
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
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { NetService } from 'src/net/net.service';
import { MatchService } from 'src/match/match.service';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { GroupService } from 'src/group/group.service';
import { Match } from 'src/match/match.schema';
import { RedisService } from 'src/redis/redis.service';
import {
  CreateOrUpdateTeamResponse,
  GetEventWithTeamsResponse,
  GetTeamDetailsResponse,
  GetTeamResponse,
  GetTeamsResponse,
  GetTeamstandingsResponse,
} from './team.response';
import { RoundService } from 'src/round/round.service';
import { CustomPlayerStats } from 'src/player-stats/player-stats.response';
import { Net } from 'src/net/net.schema';
import { playerKey } from 'src/util/helper';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { PlayerStatsEntry } from 'src/event/resolvers/event.response';

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
    private playerRankingService: PlayerRankingService,
    private groupService: GroupService,
    private roundService: RoundService,
    private playerStatsService: PlayerStatsService,
    private readonly redisService: RedisService,
  ) {}

  async singleDelete(teamExist: Team) {
    const teamPlayerIds = teamExist.players.map((p) => p.toString());
    const teamNetIds = teamExist.nets.map((n) => n.toString());
    const teamMatchIds = teamExist.matches.map((m) => m.toString());

    const updatePromises = [];
    updatePromises.push(this.playerRankingService.deleteOne({ team: teamExist._id }));

    updatePromises.push(
      this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $pull: { team: teamPlayerIds } }),
    );
    updatePromises.push(this.netService.deleteMany({ _id: { $in: teamNetIds } }));
    if (teamExist.captain)
      updatePromises.push(this.playerService.updateOne({ _d: teamExist.captain }, { $pull: { teams: teamExist._id } }));
    if (teamExist.cocaptain)
      updatePromises.push(
        this.playerService.updateOne({ _d: teamExist.cocaptain }, { $pull: { teams: teamExist._id } }),
      );
    if (teamMatchIds.length > 0)
      updatePromises.push(
        this.matchService.updateMany({ _id: { $in: teamMatchIds } }, { $set: { teamA: null, teamB: null } }),
      );
    updatePromises.push(this.teamService.delete({ _id: teamExist._id }));
    await Promise.all(updatePromises);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
  async createTeam(
    @Args('input') input: CreateTeamInput,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true })
    logo?: Upload,
  ): Promise<CreateOrUpdateTeamResponse> {
    try {
      const players = input.players ? input.players : [];

      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);

      const teamExist = await this.teamService.findOne({ name: input.name, event: input.event });
      if (teamExist) {
        return AppResponse.handleError({
          code: 404,
          success: false,
          message: 'There is already a team exist with this name in this event!',
        });
      }

      const teamObj: Team = {
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
        playerRankings: [],
      };
      if (input.group) {
        teamObj.group = input.group;
      }
      const [newTeam, findEvent] = await Promise.all([
        this.teamService.create(teamObj),
        this.eventService.findById(input.event.toString()),
      ]);

      // ===== Captain - User - Player - Team Relationship update =====
      const promiseOperations = [];
      promiseOperations.push(this.eventService.updateOne({ _id: input.event }, { $push: { teams: newTeam._id } }));

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
        const username = this.playerService.playerUsername(findPlayer.username);
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

      if (input.group) {
        promiseOperations.push(
          this.groupService.updateOne({ _id: input.group }, { $addToSet: { teams: newTeam._id } }),
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
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
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
      if (teamObj.division) {
        const newDivision = teamObj.division.toString().trim().toLowerCase();
        teamObj.division = newDivision;
        updatePromises.push(
          this.playerService.updateMany({ teams: { $in: [teamExist._id] } }, { $set: { division: newDivision } }),
        );
      }

      // ===== Update captain =====
      if (input.captain) {
        const playerExist = await this.playerService.findById(input.captain.toString());

        if (playerExist) {
          // const newUsername = playerExist.firstName.trim().toLowerCase() + teamExist.num.toString();
          const newUsername = this.playerService.playerUsername(playerExist.firstName);
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
          // const newUsername = playerExist.firstName.toLowerCase() + teamExist.num.toString();
          const newUsername = this.playerService.playerUsername(playerExist.firstName);
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

      if (input.event && input.event !== teamExist.event.toString()) {
        updatePromises.push(this.eventService.updateOne({ _id: eventId }, { $pull: { teams: teamId } })); // Previous event
        updatePromises.push(this.eventService.updateOne({ _id: input.event }, { $addToSet: { teams: teamId } })); // New event
      }

      // =====  Update players =====
      const players = input.players ? input.players : [];
      const prevPlayerIds = teamExist.players.map((pId) => pId.toString());
      for (let i = 0; i < players.length; i += 1) {
        updatePromises.push(this.playerService.updateOne({ _id: players[i] }, { $addToSet: { teams: teamExist._id } }));
      }
      teamObj.players = [...new Set([...prevPlayerIds, ...players])];
      updatePromises.push(this.teamService.updateOne({ _id: teamId }, teamObj));

      // ===== Update Player Ranking (Make sure all players have ranking) =====
      const playerRankings = await this.playerRankingService.find({ team: teamId, rankLock: false });
      if (playerRankings && playerRankings.length > 0 && players && players.length > 0) {
        for (const pr of playerRankings) {
          const rankings = await this.playerRankingService.findItems({ playerRanking: pr._id });
          const highestRank = rankings.length === 0 ? 0 : Math.max(...rankings.map((p) => p.rank));

          const itemsToInsert = [];
          let rankIncrement = 0;
          for (let i = 0; i < teamObj.players.length; i += 1) {
            const findRank = rankings.find((r) => r.player.toString() === teamObj.players[i]);
            if (!findRank) {
              itemsToInsert.push({
                player: teamObj.players[i],
                rank: highestRank + rankIncrement + 1,
                playerRanking: pr._id,
              });
              rankIncrement += 1;
            }
          }
          if (itemsToInsert && itemsToInsert.length > 0) {
            const rankings = await this.playerRankingService.insertManyItems(itemsToInsert);
            await this.playerRankingService.updateOne(
              { _id: pr._id },
              { $addToSet: { rankings: { $each: rankings.map((ri) => ri._id.toString()) } } },
            );
          }
        }
      }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
  async deleteTeam(@Args('teamId') teamId: string): Promise<CreateOrUpdateTeamResponse> {
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTeamResponse)
  async deleteTeams(@Args('teamIds', { type: () => [String] }) teamIds: string[]): Promise<CreateOrUpdateTeamResponse> {
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

          if (teamExist.event) {
            deletePromises.push(
              this.eventService.updateOne({ _id: teamExist.event.toString() }, { $pull: { teams: teamExist._id } }),
            );
          }

          if (teamExist.players && teamExist.players.length > 0) {
            deletePromises.push(
              this.playerService.updateMany(
                { _id: { $in: teamExist.players } },
                { $pull: { teams: teamExist._id.toString() } },
              ),
            );
          }

          if (teamExist.nets && teamExist.nets.length > 0) {
            // deletePromises.push(this.netService.update);
          }

          if (teamExist.group) {
            deletePromises.push(
              this.groupService.updateOne({ _id: teamExist.group }, { $pull: { teams: teamExist._id.toString() } }),
            );
          }

          if (teamExist.playerRankings && teamExist.playerRankings.length > 0) {
            const playerRankings = await this.playerRankingService.find({ _id: { $in: teamExist.playerRankings } });
            for (const pr of playerRankings) {
              deletePromises.push(this.playerRankingService.deleteManyItem({ _id: { $in: pr.rankings } }));
            }
            deletePromises.push(this.playerRankingService.deletMany({ _id: { $in: teamExist.playerRankings } }));
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
  Field;
  @Roles(UserRole.admin, UserRole.director)
  @Query((_returns) => GetTeamsResponse)
  async getTeams(@Args('eventId', { nullable: true }) eventId: string) {
    try {
      const query: Record<string, any> = {};
      if (eventId) query.event = eventId;
      const teams = await this.teamService.find(query);
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

  @Query((_returns) => GetEventWithTeamsResponse)
  async getEventWithTeams(@Args('eventId', { nullable: true }) eventId: string) {
    try {
      const [eventExist, teams, groups, players] = await Promise.all([
        this.eventService.findById(eventId),
        this.teamService.find({ event: eventId }),
        this.groupService.find({ event: eventId }),
        this.playerService.find({ event: eventId }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of teams!',
        data: { event: eventExist, teams, groups, players },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetTeamResponse)
  async getTeam(@Args('teamId') teamId: string) {
    try {
      const teamExist = await this.teamService.findById(teamId);
      // getPlayer Rankings
      if (!teamExist) return AppResponse.notFound('Team');

      const locked = await this.playerRankingService.lockPlayerRanking(teamId, teamExist.event.toString());
      console.log({ locked });

      return {
        code: HttpStatus.OK,
        success: true,
        data: teamExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((_returns) => GetTeamDetailsResponse)
  async getTeamDetails(@Args('teamId') teamId: string) {
    try {
      const [team, playerRanking] = await Promise.all([
        this.teamService.findById(teamId),
        this.playerRankingService.findOne({
          team: teamId,
          // rankLock: false,
          $or: [
            { match: { $exists: false } }, // `match` is undefined
            { match: null }, // `match` is null
          ],
        }),
      ]);
      const [players, group, captain, cocaptain, event, matches, rankings] = await Promise.all([
        // this.playerService.find({ teams: { $in: [team._id] } }),
        this.playerService.find({ events: { $in: [team.event] } }),
        this.groupService.findOne({ _id: team.group }),
        this.playerService.findOne({ _id: team.captain }),
        this.playerService.findOne({ _id: team.cocaptain }),
        this.eventService.findOne({ _id: team.event }),
        this.matchService.find({
          $or: [{ teamA: team._id.toString() }, { teamB: team._id.toString() }],
        }),
        this.playerRankingService.findItems({ playerRanking: playerRanking._id }),
      ]);


      // Attributes of matches
      const matchIds = matches.map((m) => m._id);
      // const oponentTeamIds = [
      //   ...new Set(matches.map((m) => (m.teamA.toString() === teamId ? m.teamB.toString() : m.teamA.toString()))),
      // ];
      const [rounds, nets, teams] = await Promise.all([
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
        this.teamService.find({ event: team.event }),
      ]);


      // All player stats

      const playerToNets: Record<string, Net[]> = {};
      for (const net of nets) {
        [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB].forEach((pid) => {
          if (!pid) return;
          if (!playerToNets[pid]) playerToNets[pid] = [];
          playerToNets[pid].push(net);
        });
      }


      const statsOfPlayer: Record<string, CustomPlayerStats[]> = {};

      // Process players in parallel
      await Promise.all(
        players.map(async (player) => {
          if (!player?._id) return;

          const netsOfPlayer = playerToNets[player._id] || [];

          // Batch Redis queries
          const redisKeys = netsOfPlayer.map((net) => playerKey(player._id, net._id));
          const redisResults = await Promise.all(redisKeys.map((key) => this.redisService.get(key)));

          const playerstatsRedis = (redisResults as CustomPlayerStats[]).filter(Boolean) as CustomPlayerStats[];
          const redisNetIds = new Set(playerstatsRedis.map((ps) => ps.net));

          // Query DB once, filter in DB if possible
          const playerstatsDB = await this.playerStatsService.find({ player: player._id });

          // Convert Mongoose documents to plain objects and filter
          const playerstatsDBPlain = playerstatsDB
            .map((ps) => {
              const plainObj = ps.toObject() as any;
              return {
                ...plainObj,
                net: String(plainObj.net),
                player: String(plainObj.player),
                match: String(plainObj.match),
              } as CustomPlayerStats;
            })
            .filter((ps: CustomPlayerStats) => !redisNetIds.has(String(ps.net)));

          // Merge both sources
          statsOfPlayer[player._id] = [...playerstatsRedis, ...playerstatsDBPlain];
        }),
      );

      const statsArray: PlayerStatsEntry[] = Object.entries(statsOfPlayer).map(([playerId, stats]) => ({
        playerId,
        stats,
      }));


      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          team,
          playerRanking,
          players,
          group,
          captain,
          cocaptain,
          event,
          matches,
          rankings,
          rounds,
          nets,
          teams,
          statsOfPlayer: statsArray,
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((_returns) => GetTeamstandingsResponse)
  async getTeamStandings(@Args('eventId') eventId: string) {
    try {
      const [event, groups, matches, teams] = await Promise.all([
        this.eventService.findOne({ _id: eventId }),
        this.groupService.find({ event: eventId }),
        this.matchService.find({ event: eventId }),
        this.teamService.find({ event: eventId }),
      ]);

      const matchIds = matches.map((m) => m._id.toString());
      const [rounds, nets] = await Promise.all([
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        data: { event, groups, matches, teams, rounds, nets },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
  /**
   * POPULATE
   * ===============================================================================================
   */

  @ResolveField(() => [Player]) // Specify the return type for "players"
  async players(@Parent() team: Team): Promise<Player[]> {
    try {
      // If not cached, fetch the players from the database
      const players = await this.playerService.find({ teams: { $in: [team._id.toString()] } });

      return players;
    } catch (error) {
      // Handle errors gracefully
      console.error('Error resolving players:', error);
      return []; // Return an empty array in case of error
    }
  }
  @ResolveField(() => PlayerRanking, { nullable: true })
  async playerRanking(@Parent() team: Team): Promise<PlayerRanking> {
    try {
      const playerRanking = await this.playerRankingService.findOne({
        team: team._id,
        // rankLock: false,
        $or: [
          { match: { $exists: false } }, // `match` is undefined
          { match: null }, // `match` is null
        ],
      }); // For secific match a rank will be locked
      return playerRanking;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  @ResolveField(() => [PlayerRankingItem]) // Specify the return type as an array of PlayerRankingItem
  async rankings(@Parent() team: Team): Promise<PlayerRankingItem[]> {
    try {
      const pr = await this.playerRankingService.findOne({
        $or: [
          { match: { $exists: false } }, // `match` is undefined
          { match: null }, // `match` is null
        ],
        team: team._id,
      });
      const rankingItems = await this.playerRankingService.findItems({ _id: { $in: pr.rankings } });

      // Ensure rank is not null for any item
      return rankingItems.map((item) => {
        if (item.rank === null) {
          item.rank = -1; // or some default value
        }
        return item;
      });
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  @ResolveField(() => PlayerRankingItem) // Specify the return type as an array of PlayerRankingItem
  async player(@Parent() pri: PlayerRankingItem): Promise<Player> {
    try {
      return this.playerService.findById(pri.player.toString());
    } catch (error) {
      console.log(error);
      return null;
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

  @ResolveField()
  async group(@Parent() team: Team) {
    const groupExist = await this.groupService.findOne({ _id: team.group });
    return groupExist;
  }

  @ResolveField() // Specify the return type for "players"
  async matches(@Parent() team: Team): Promise<Match[]> {
    try {
      const matches = await this.matchService.find({
        $or: [{ teamA: team._id.toString() }, { teamB: team._id.toString() }],
      });
      return matches;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
