import { TeamService } from 'src/team/team.service';
import { LdoService } from 'src/ldo/ldo.service';
import { MatchService } from 'src/match/match.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { GroupService } from 'src/group/group.service';

// import { IMatchQueries } from '../resolvers/event.types';
import { HttpStatus, Injectable } from '@nestjs/common';
import { FilterQueryInput, SearchFilterInput } from './match.input';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { ConfigService } from '@nestjs/config';
import { tokenToUser } from 'src/utils/helper';
import { UserService } from 'src/user/user.service';
import { ETieBreakingStrategy } from 'src/event/event.schema';
import { QueryFilter } from 'mongoose';
import { EMatchStatus, Match } from '../match.schema';
import { GetEventWithMatchesResponse } from './match.response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { EPlayerStatus } from 'src/player/player.schema';
import { EActionProcess } from 'src/round/round.schema';

// IMatchQueries

@Injectable()
export class MatchQueries {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private eventService: EventService,
    private teamService: TeamService,
    private ldoService: LdoService,
    private matchService: MatchService,
    private roundService: RoundService,
    private netService: NetService,
    private groupService: GroupService,
    private playerRankingService: PlayerRankingService,
    private playerService: PlayerService,
  ) {}

  // Helper functions
  async updateTeamRanking(teamId: string, matchId: string) {
    const teamRanking = await this.playerRankingService.findOne({ match: matchId, team: teamId });
    if (!teamRanking) return;

    // Get active players for the team
    const players = await this.playerService.find({ teams: teamId });
    const validPlayerIds = new Set(players.filter((p) => p.status === EPlayerStatus.ACTIVE).map((p) => String(p._id)));

    // Get rankings for the team
    const rankings = await this.playerRankingService.findItems({ playerRanking: teamRanking._id });

    // Keep only valid players and sort
    const sorted = rankings.filter((r) => validPlayerIds.has(String(r.player))).sort((a, b) => a.rank - b.rank);

    // Update ranks in parallel
    await Promise.all(
      sorted.map((r, idx) => this.playerRankingService.updateOneItem({ _id: r._id }, { rank: idx + 1 })),
    );
  }

  async getMatches(filter?: FilterQueryInput) {
    try {
      // Assuming matchService is injected in your class
      const matches = await this.matchService.find(filter);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of matches',
        data: matches,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async searchMatches(eventId: string, filter: SearchFilterInput) {
    try {
      // Fetch event
      const event = await this.eventService.findOne({ _id: eventId });
      if (!event) return AppResponse.notFound('Event');

      // Fetch groups + ldo in parallel
      const [ldo, groups] = await Promise.all([
        this.ldoService.findByDirectorId(String(event.ldo)),
        this.groupService.find({ event: eventId }),
      ]);

      // Build match filter
      const matchFilter: QueryFilter<Match> = { event: eventId };

      let searchFound = false;

      // Team filter (case-insensitive exact match)
      if (filter?.search) {
        const teams = await this.teamService.find({
          name: { $regex: new RegExp(filter.search, 'i') }, // partial + case-insensitive
        });
        if (teams.length > 0) {
          searchFound = true;
          const teamIds = teams.map((t) => t._id);
          matchFilter.$or = [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }];
        }
      }

      // Flexible string filters (partial matches, case-insensitive)
      if (filter?.search && !searchFound) {
        matchFilter.$or = [
          { description: { $regex: filter.search, $options: 'i' } },
          { location: { $regex: filter.search, $options: 'i' } },
        ];
      }

      if (filter?.division) {
        matchFilter.division = { $regex: new RegExp(filter.division.trim(), 'i') };
      }

      if (filter?.group) {
        matchFilter.group = filter.group;
      }

      // matchFilter._id = "68f2c101277224677c41851d";

      if (filter?.status === EMatchStatus.COMPLETED) {
        matchFilter.completed = true;
      } else if (filter?.status) {
        filter.limit = 5000;
      }
      let matches = await this.matchService.find(matchFilter, filter?.limit || 30, filter?.offset || 0);

      // Collect IDs efficiently
      const teamIds = new Set<string>();
      const matchIds = new Set<string>();

      for (const m of matches) {
        matchIds.add(m._id);
        if (m.teamA) teamIds.add(m.teamA as string);
        if (m.teamB) teamIds.add(m.teamB as string);
      }

      // Fetch related entities in parallel
      const [nets, rounds, teams] = await Promise.all([
        this.netService.find({ match: { $in: [...matchIds] } }),
        this.roundService.find({ match: { $in: [...matchIds] } }),
        this.teamService.find({ event: eventId }), // { _id: { $in: [...teamIds] } }
      ]);

      if (filter?.status) {
        if (filter.status === EMatchStatus.IN_PROGRESS) {
          // Check all matches that are not completed and have first round teamAProcess is not INITIATE
          matches = matches.filter((m) => {
            if (m.completed) return false;
            const firstRound = rounds.find((r) => String(r.match) === String(m._id));
            if (!firstRound) return false;
            return firstRound && firstRound.teamAProcess !== EActionProcess.INITIATE;
          });
        } else if (filter.status === EMatchStatus.NOT_STARTED) {
          // Check all matches that are not completed and have first round teamAProcess is INITIATE
          matches = matches.filter((m) => {
            if (m.completed) return false;
            const firstRound = rounds.find((r) => String(r.match) === String(m._id));
            if (!firstRound) return false;
            return firstRound && firstRound.teamAProcess === EActionProcess.INITIATE;
          });
        } else if (filter.status === EMatchStatus.CURRENT) {
          // Check all matches that are not completed and have first round teamAProcess is CHECKIN
          matches = matches.filter((m) => {
            if (m.completed) return false;
            const firstRound = rounds.find((r) => String(r.match) === String(m._id));
            if (!firstRound) return false;
            return firstRound && firstRound.teamAProcess === EActionProcess.CHECKIN;
          });
        } else if (filter.status === EMatchStatus.PAST) {
          // CHeck all matches date is less than current date
          matches = matches.filter((m) => new Date(m.date) < new Date());
        }
      }
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of matches',
        data: { event, groups, ldo, matches, nets, rounds, teams },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getEventWithMatches(context: any, eventId: string) {
    try {
      // Return any one of them between player and event
      // const secret = this.configService.get<string>('JWT_SECRET');
      // const userPayload = tokenToUser(context, secret);

      // // Get user
      // const loggedUser = await this.userService.findById(userPayload?._id);
      // if (!loggedUser) return AppResponse.unauthorized();

      // Assuming matchService is injected in your class
      const [event, matches, teams, ldo, groups] = await Promise.all([
        this.eventService.findById(eventId),
        this.matchService.find({ event: eventId }),
        this.teamService.find({ event: eventId }),
        this.ldoService.findOne({ events: { $in: [eventId] } }),
        this.groupService.find({ event: eventId }),
      ]);

      // Net is not adding in the team
      const matchIds = matches.map((m) => m._id.toString());
      const [rounds, nets] = await Promise.all([
        this.roundService.find({ match: { $in: matchIds } }),
        this.netService.find({ match: { $in: matchIds } }),
      ]);

      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Get details of event, matches, teams, ldo, groups, rounds, nets',
        data: { event, matches, teams, ldo, groups, rounds, nets },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getMatch(matchId: string) {
    try {
      const matchExist = await this.matchService.findById(matchId);

      if (!matchExist) return AppResponse.notFound('Match');

      // Auto-complete match if all nets have scores (even 0 is valid)
      /*
      if (!matchExist.completed) {
        // Find nets that are missing scores
        const incompleteNets = await this.netService.find({
          match: matchExist._id,
          $or: [{ teamAScore: null }, { teamBScore: null }],
        });

        // If no incomplete nets, mark match as completed
        if (incompleteNets.length === 0) {
          if (matchExist.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND) {
            if (matchExist.extendedOvertime) {
              await this.matchService.updateOne({ _id: matchExist._id }, { $set: { completed: true } });
              matchExist.completed = true; // update local object
            }
          } else {
            await this.matchService.updateOne({ _id: matchExist._id }, { $set: { completed: true } });
            matchExist.completed = true; // update local object
          }
        }
      }
      */

      // Re-rank players for both teams (only if teams exist)
      // await Promise.all([
      //   matchExist.teamA ? this.updateTeamRanking(String(matchExist.teamA), matchId) : Promise.resolve(),
      //   matchExist.teamB ? this.updateTeamRanking(String(matchExist.teamB), matchId) : Promise.resolve(),
      // ]);

      await this.updateTeamRanking(String(matchExist.teamB), matchId);
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'Got the match',
        data: matchExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
