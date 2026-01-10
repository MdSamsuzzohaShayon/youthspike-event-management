import { Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway.service';
import { JwtService } from '@nestjs/jwt';
import { Team } from 'src/team/team.schema';

@Injectable()
export class ValidationHelper {
  constructor(private readonly gatewayService: GatewayService) {}

  /**
   * Throws if a captain tries to start a new match while another one is already running.
   */
  async validateCaptainCheckIn(userId: string, teamA: string, teamB: string): Promise<void> {
    const { playerService, teamService, matchService, roundService } = this.gatewayService.getServices();

    /* ---------- 1 . Identify the captain & his teams ---------- */
    const captain = await playerService.findOne({ $or: [{ captainuser: userId }, { cocaptainuser: userId }] });
    if (!captain) {
      throw new Error('You are not a captain!');
    }

    if (
      !(captain.captainofteams as string[]).includes(String(teamA)) &&
      !(captain.captainofteams as string[]).includes(String(teamB)) &&
      !(captain.cocaptainofteams as string[]).includes(String(teamA)) &&
      !(captain.cocaptainofteams as string[]).includes(String(teamB))
    ) {
      throw new Error('You are not assigned as captain of team A and team B');
    }

    let teamIds = captain.teams.map((t: any) => t._id.toString());

    // Captain must be included in the team
    if (!captain?.teams?.length) {
      const teams = await teamService.find({ _id: { $in: [teamA, teamB] } });
      if (teams.length === 0) {
        throw new Error('You are not the captain of the team');
      }

      let teamOfCaptain: null | Team = null;
      for (const team of teams) {
        for (const playerId of team.players) {
          // Check player is part of the team
          if (String(playerId) === String(captain._id)) {
            teamOfCaptain = team;
          }
        }
      }
      if (!teamOfCaptain) {
        throw new Error('You are not the captain or co-captain of those team that is playing!');
      }

      if (
        String(teamOfCaptain.captain) === String(captain._id) ||
        String(teamOfCaptain.cocaptain) === String(captain._id)
      ) {
        // Set team in player
        await playerService.updateOne({ _id: captain._id }, { $addToSet: { teams: teamOfCaptain._id } });
      }
    }

    /* ---------- 2 . Make sure the teams really exist ---------- */
    const teamCount = await teamService.countDocuments({ _id: { $in: teamIds } });
    if (teamCount === 0) {
      throw new Error('Can not find this team in the database!');
    }

    /* ---------- 3 . Find every match that involves these teams ---------- */
    const matches = await matchService.find({
      $or: [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }],
    });

    if (!matches.length) {
      throw new Error('Captain does not have a match!');
    }

    /* ---------- 4 . Fetch the FIRST round of every match in one go ---------- */
    const matchIds = matches.map((m) => m._id);
    const rounds = await roundService.find({ match: { $in: matchIds } });

    if (!rounds.length) {
      throw new Error('Does not have any round in the match!');
    }

    /*
    // Build a quick lookup: match _id  ➜ earliest round
    const firstRoundByMatch = new Map<string, any>();
    for (const r of rounds) {
      const id = r.match.toString();
      if (!firstRoundByMatch.has(id)) firstRoundByMatch.set(id, r);
    }

    // Validate that no unfinished match is in progress
    const captainTeam = teamIds[0]; // business rule: pick the first team

    for (const match of matches) {
      const firstRound = firstRoundByMatch.get(match._id.toString());
      if (!firstRound) continue; // safety – shouldn’t happen after step 4

      const isCaptainTeamA = captainTeam === match.teamA.toString();
      const process =
        isCaptainTeamA ? firstRound.teamAProcess : firstRound.teamBProcess;

      if (process !== EActionProcess.INITIATE && !match.completed) {
        throw new Error(
          `A match is already running (${match._id}), until you complete that match you can not start a new match!`,
        );
      }
    }

    */
  }

  async authCheck(accessCode: string | null, jwtService: JwtService, matchAccessCode: string | null) {
    let isJwtValid = false;
    if (accessCode) {
      try {
        await jwtService.verifyAsync(accessCode); // uses secret from module options
        isJwtValid = true;
      } catch {
        isJwtValid = false;
      }
    }

    if (!isJwtValid && accessCode !== matchAccessCode) {
      throw new Error(`Access denied! Try logging in again and re-entering access code.`);
    }
  }
}
