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
import { CustomGroup, CustomTeam, GetEventWithMatchesResponse, GetMatchesResponse } from './match.response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { PlayerService } from 'src/player/player.service';
import { EPlayerStatus } from 'src/player/player.schema';
import { EActionProcess, Round } from 'src/round/round.schema';
import { Team } from 'src/team/team.schema';
import { LDO } from 'src/ldo/ldo.schema';
import { Group } from 'src/group/group.schema';
import { User } from 'src/user/user.schema';
import { CustomMatch, CustomNet, CustomRound } from 'src/team/resolvers/team.response';

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

  async searchMatches(
    context: unknown,
    filter: SearchFilterInput,
    eventId?: string,
  ): Promise<GetEventWithMatchesResponse> {
    try {
      const limit = filter?.limit ?? 30;
      const offset = filter?.offset ?? 0;
  
      /**
       * ---------------------------------------------------------
       * 1. Fetch Event (if provided)
       * ---------------------------------------------------------
       */
      const event = eventId
        ? await this.eventService.findOne({ _id: eventId })
        : null;
  
      /**
       * ---------------------------------------------------------
       * 2. Extract Logged-in User from Token
       * ---------------------------------------------------------
       */
      let loggedUser: User | null = null;
  
      try {
        const jwtSecret = this.configService.get<string>('JWT_SECRET');
        const userPayload = tokenToUser(context, jwtSecret);
        loggedUser = await this.userService.findById(userPayload?._id);
      } catch (error) {
        console.error(`User authentication error: ${error}`);
      }
  
      /**
       * ---------------------------------------------------------
       * 3. Fetch LDO and Groups (if event exists)
       * ---------------------------------------------------------
       */
      let ldo: LDO | null = null;
      let groups: Group[] = [];
  
      if (eventId && event) {
        [ldo, groups] = await Promise.all([
          this.ldoService.findByDirectorId(String(event.ldo)),
          this.groupService.find({ event: eventId }),
        ]);
      }
  
      /**
       * ---------------------------------------------------------
       * 4. Build Match Filter
       * ---------------------------------------------------------
       */
      const matchFilter: QueryFilter<Match> = {};
  
      if (eventId) {
        matchFilter.event = eventId;
      }
  
      /**
       * ---------------------------------------------------------
       * 5. Captain / Co-captain filter
       * ---------------------------------------------------------
       */
      if (loggedUser?.captainplayer || loggedUser?.cocaptainplayer) {
        const team = loggedUser.captainplayer
          ? await this.teamService.findOne({ captain: loggedUser.captainplayer })
          : await this.teamService.findOne({ cocaptain: loggedUser.cocaptainplayer });
  
        if (!team) {
          return AppResponse.notFound('Team');
        }
  
        matchFilter.$or = [
          { teamA: String(team._id) },
          { teamB: String(team._id) },
        ];
      }
  
      /**
       * ---------------------------------------------------------
       * 6. Team Search Filter
       * ---------------------------------------------------------
       */
      let teamSearchMatched = false;
  
      if (filter?.search) {
        const teams = await this.teamService.find({
          name: { $regex: new RegExp(filter.search, 'i') },
        });
  
        if (teams.length > 0) {
          teamSearchMatched = true;
  
          const teamIds = teams.map((team) => team._id);
  
          matchFilter.$or = [
            { teamA: { $in: teamIds } },
            { teamB: { $in: teamIds } },
          ];
        }
      }
  
      /**
       * ---------------------------------------------------------
       * 7. Description / Location Search
       * ---------------------------------------------------------
       */
      if (filter?.search && !teamSearchMatched) {
        matchFilter.$or = [
          { description: { $regex: filter.search, $options: 'i' } },
          { location: { $regex: filter.search, $options: 'i' } },
        ];
      }
  
      /**
       * ---------------------------------------------------------
       * 8. Division / Group Filters
       * ---------------------------------------------------------
       */
      if (filter?.division) {
        matchFilter.division = {
          $regex: new RegExp(filter.division.trim(), 'i'),
        };
      }
  
      if (filter?.group) {
        matchFilter.group = filter.group;
      }
  
      /**
       * ---------------------------------------------------------
       * 9. Completed Filter
       * ---------------------------------------------------------
       */
      if (filter?.status === EMatchStatus.COMPLETED) {
        matchFilter.completed = true;
      } else if (filter?.status) {
        filter.limit = 5000;
      }
  
      /**
       * ---------------------------------------------------------
       * 10. Fetch Matches
       * ---------------------------------------------------------
       */
      let matches = await this.matchService.find(
        matchFilter,
        limit,
        offset,
      );
  
      /**
       * ---------------------------------------------------------
       * 11. Collect Match IDs
       * ---------------------------------------------------------
       */
      const matchIds = matches.map((match) => match._id);
  
      /**
       * ---------------------------------------------------------
       * 12. Fetch Related Data in Parallel
       * ---------------------------------------------------------
       */
      const teamFilter: QueryFilter<Team> = eventId ? { event: eventId } : {};
  
      const [nets, rounds, teams] = await Promise.all([
        this.netService.find({ match: { $in: matchIds } }),
        this.roundService.find({ match: { $in: matchIds } }),
        this.teamService.find(teamFilter),
      ]);
  
      /**
       * ---------------------------------------------------------
       * 13. Build Round Map (O(1) lookup)
       * ---------------------------------------------------------
       */
      const roundMap = new Map<string, Round>();
  
      for (const round of rounds) {
        roundMap.set(String(round.match), round);
      }
  
      /**
       * ---------------------------------------------------------
       * 14. Status-based Filtering
       * ---------------------------------------------------------
       */
      if (filter?.status) {
        const now = new Date();
  
        matches = matches.filter((match) => {
          const firstRound = roundMap.get(String(match._id));
  
          if (!firstRound) return false;
  
          switch (filter.status) {
            case EMatchStatus.IN_PROGRESS:
              return !match.completed &&
                firstRound.teamAProcess !== EActionProcess.INITIATE;
  
            case EMatchStatus.NOT_STARTED:
              return !match.completed &&
                firstRound.teamAProcess === EActionProcess.INITIATE;
  
            case EMatchStatus.CURRENT:
              return !match.completed &&
                firstRound.teamAProcess === EActionProcess.CHECKIN;
  
            case EMatchStatus.PAST:
              return new Date(match.date) < now;
  
            default:
              return true;
          }
        });
      }
  
      /**
       * ---------------------------------------------------------
       * 15. Return Response
       * ---------------------------------------------------------
       */
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of matches',
        data: {
          event,
          groups: groups as CustomGroup[],
          ldo,
          matches: matches as CustomMatch[],
          nets: nets as unknown as CustomNet[],
          rounds: rounds as CustomRound[],
          teams: teams as CustomTeam[],
        },
      };
  
    } catch (error) {
      return AppResponse.handleError(error);
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
