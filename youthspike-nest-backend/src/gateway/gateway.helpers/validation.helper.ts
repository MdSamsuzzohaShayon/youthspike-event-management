import { Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway.service';
import { EActionProcess } from 'src/round/round.schema';

@Injectable()
export class ValidationHelper {
  constructor(private readonly gatewayService: GatewayService) {}

  /**
   * Throws if a captain tries to start a new match while another one is already running.
   */
  async validateCaptainCheckIn(userId: string): Promise<void> {
    const {
      playerService,
      teamService,
      matchService,
      roundService,
    } = this.gatewayService.getServices();

    /* ---------- 1 . Identify the captain & his teams ---------- */
    const captain = await playerService
      .findOne({ $or: [{ captainuser: userId }, { cocaptainuser: userId }] });

    if (!captain?.teams?.length) {
      throw new Error('This player does not have a team');
    }

    const teamIds = captain.teams.map((t: any) => t._id.toString());

    /* ---------- 2 . Make sure the teams really exist ---------- */
    const teamCount = await teamService.countDocuments({ _id: { $in: teamIds } });
    if (teamCount === 0) {
      throw new Error('Can not find this team in the database!');
    }

    /* ---------- 3 . Find every match that involves these teams ---------- */
    const matches = await matchService
      .find({
        $or: [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }],
      });

    if (!matches.length) {
      throw new Error('Captain does not have a match!');
    }

    /* ---------- 4 . Fetch the FIRST round of every match in one go ---------- */
    const matchIds = matches.map((m) => m._id);
    const rounds = await roundService
      .find({ match: { $in: matchIds } });

    if (!rounds.length) {
      throw new Error('Does not have any round in the match!');
    }

    // Build a quick lookup: match _id  ➜ earliest round
    const firstRoundByMatch = new Map<string, any>();
    for (const r of rounds) {
      const id = r.match.toString();
      if (!firstRoundByMatch.has(id)) firstRoundByMatch.set(id, r);
    }

    /* ---------- 5 . Validate that no unfinished match is in progress ---------- */
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
  }
}
