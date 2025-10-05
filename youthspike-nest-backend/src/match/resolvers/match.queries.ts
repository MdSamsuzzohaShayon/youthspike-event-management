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
import { tokenToUser } from 'src/util/helper';
import { UserService } from 'src/user/user.service';
import { ETieBreakingStrategy } from 'src/event/event.schema';
import { FilterQuery } from 'mongoose';
import { EMatchStatus, Match } from '../match.schema';
import { GetEventWithMatchesResponse } from './match.response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { EPlayerStatus } from 'src/player/player.schema';

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
      const matchFilter: FilterQuery<Match> = { event: eventId };

      let searchFound = false;

      // Team filter (case-insensitive exact match)
      if (filter?.search) {
        const team = await this.teamService.findOne({
          name: { $regex: new RegExp(filter.search, 'i') }, // partial + case-insensitive
        });
        if (team) {
          searchFound = true;
          matchFilter.$or = [{ teamA: team._id }, { teamB: team._id }];
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

      if (filter?.status) {
        if (filter.status === EMatchStatus.COMPLETED) {
          matchFilter.completed = true;
        }
        // else if(filter.status)
      }

      /*
  // ✅ Compute filtered matches on demand
  const filteredMatchList = useMemo(() => {
    if (!filter) return matchList || [];

    switch (filter) {
      case EEventPeriod.CURRENT:
        return (matchList || []).filter((m) => m?.date && validateMatchDatetime(m.date) === EEventPeriod.CURRENT);
      case EEventPeriod.PAST:
        return (matchList || []).filter((m) => m?.date && validateMatchDatetime(m.date) === EEventPeriod.PAST);
      case EMatchStatus.COMPLETED:
        return (matchList || []).filter((m) => m?.completed);
      case EMatchStatus.IN_PROGRESS:
        return (matchList || []).filter(
          (m) => !m?.completed && m?.rounds?.length > 0 && m.rounds[0]?.teamAProcess !== EActionProcess.INITIATE
        );
      case EMatchStatus.NOT_STARTED:
        return (matchList || []).filter(
          (m) => !m?.completed && m?.rounds?.length > 0 && m.rounds[0]?.teamAProcess === EActionProcess.INITIATE
        );
      default:
        return matchList || [];
    }
  }, [matchList, filter]);

      */

      // Fetch matches (paginated)
      const matches = await this.matchService.find(matchFilter, filter?.limit || 30, filter?.offset || 0);

      // Collect IDs efficiently
      const netIds = new Set<string>();
      const roundIds = new Set<string>();
      const teamIds = new Set<string>();

      matches.forEach((m) => {
        m.nets?.forEach((n) => netIds.add(String(n)));
        m.rounds?.forEach((r) => roundIds.add(String(r)));
        if (m.teamA) teamIds.add(String(m.teamA));
        if (m.teamB) teamIds.add(String(m.teamB));
      });

      // Fetch related entities in parallel
      const [nets, rounds, teams] = await Promise.all([
        this.netService.find({ _id: { $in: [...netIds] } }),
        this.roundService.find({ _id: { $in: [...roundIds] } }),
        this.teamService.find({ _id: { $in: [...teamIds] } }),
      ]);

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
      await Promise.all([
        matchExist.teamA ? this.updateTeamRanking(String(matchExist.teamA), matchId) : Promise.resolve(),
        matchExist.teamB ? this.updateTeamRanking(String(matchExist.teamB), matchId) : Promise.resolve(),
      ]);
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
