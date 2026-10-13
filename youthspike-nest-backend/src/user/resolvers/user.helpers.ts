import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventService } from "src/event/event.service";
import * as bcrypt from 'bcrypt';
import { Types } from "mongoose";
import { TeamService } from "src/team/team.service";
import { UserService } from "../user.service";
import { User, UserRole } from "../user.schema";
import { PlayerService } from "src/player/player.service";
import { Team } from "src/team/team.schema";
import { LdoService } from "src/ldo/ldo.service";
import { AppResponse } from "src/shared/response";
import { LoginResponse, LoginUser } from "./user.response";
import { JwtService } from "@nestjs/jwt";

type ObjectIdLike = Types.ObjectId | string;

@Injectable()
export default class UserHelpers {

  constructor(
    private readonly configService: ConfigService,
    private readonly eventService: EventService,
    private readonly teamService: TeamService,
    private readonly userService: UserService,
    private readonly playerService: PlayerService,
    private readonly ldoService: LdoService,
    private readonly jwtService: JwtService,
  ) { }


  // helper functions
  async findOrCreateUser(email: string, password: string): Promise<User | null> {
    let user = await this.userService.findOne({
      email: { $regex: new RegExp(email, 'i') },
    });

    if (user) return user;

    const player = await this.playerService.findOne({ username: email });
    if (!player) return null;

    const existingUser = await this.userService.findOne({ player: player._id });

    if (existingUser) {
      await this.userService.updateOne(
        { _id: existingUser._id },
        { $set: { email } },
      );

      return this.userService.findOne({
        email: { $regex: new RegExp(email, 'i') },
      });
    }

    return this.userService.create({
      active: true,
      email,
      firstName: player.firstName,
      lastName: player.lastName,
      password,
      role: UserRole.player,
      player: player._id,
    });
  }


  async verifyPassword(input: string, hash: string): Promise<boolean> {
    return bcrypt.compare(input, hash);
  }


  buildLoginUser(user: User): LoginUser {
    return {
      role: user.role,
      events: [],
      firstName: user.firstName,
      lastName: user.lastName,
      captainplayer: user.captainplayer?.toString() ?? null,
      cocaptainplayer: user.cocaptainplayer?.toString() ?? null,
      player: user.player?.toString() ?? null,
      email: user.email,
      active: user.active,
    };
  }

  isPrivilegedRole(role: UserRole): boolean {
    return role === UserRole.admin || role === UserRole.director;
  }

  extractPlayerId(user: LoginUser): string | null {
    switch (user.role) {
      case UserRole.captain:
        return user.captainplayer;
      case UserRole.co_captain:
        return user.cocaptainplayer;
      case UserRole.player:
        return user.player;
      default:
        return null;
    }
  }


  async findTeamsByRole(role: UserRole, playerId: string): Promise<Team[]> {
    const queryMap = {
      [UserRole.captain]: { $or: [{ captainplayer: playerId }, { captain: playerId }] },
      [UserRole.co_captain]: { $or: [{ cocaptainplayer: playerId }, { cocaptain: playerId }] },
      [UserRole.player]: { players: playerId },
    };

    return this.teamService.find(queryMap[role] || {});
  }


  /**
   * Flatten every team's `events` array into a single list of string ids.
   * Pure: no `this` access, no I/O — trivially testable.
   */
  collectTeamEventIds(teams: readonly Team[]): string[] {
    return teams.flatMap((team) =>
      (team?.events ?? []).map((id) => String(id)),
    );
  }

  /**
   * Return the set of event ids present in both `playerEvents` and
   * `teamEvents`. Replaces the previous `getMatchedEvents` helper.
   * Pure: no `this` access, no I/O.
   */
  intersectEventIds(
    playerEvents: readonly string[],
    teamEvents: readonly string[],
  ): Set<string> {
    const teamEventSet = new Set(teamEvents.map((id) => String(id)));
    return new Set(
      playerEvents.map((id) => String(id)).filter((id) => teamEventSet.has(id)),
    );
  }

  /**
   * Decide which team should be attached to the login payload.
   *
   * Selection order:
   *   1. The team whose events contain the "default" event (if one exists).
   *   2. Otherwise, the first team in the list (fallback).
   *
   * Note: the caller MUST guarantee `teams` is non-empty.
   */
  async resolveTeamForDefaultEvent(
    teams: readonly Team[],
    eventIds: Set<string>,
  ): Promise<Team> {
    const fallbackTeam: Team = teams[0];

    const events = await this.eventService.find({
      _id: { $in: [...eventIds] },
    });

    if (events.length === 0) return fallbackTeam;

    const defaultEvent =
      events.find((event) => Boolean(event.defaulted)) ?? events[0];
    const defaultEventId: string = String(defaultEvent._id);

    return (
      teams.find((team) =>
        (team.events ?? []).some(
          (eventId) => String(eventId) === defaultEventId,
        ),
      ) ?? fallbackTeam
    );
  }


  attachTeamInfo(user: LoginUser, team: Team): void {
    user.team = team.name;
    user.teamLogo = team.logo;

    if (user.role === UserRole.captain || user.role === UserRole.co_captain || user.role === UserRole.player) {
      user.teamId = team._id;
    }
  }


  async validatePasscode(passcode: string, eventIds: Set<string>): Promise<string | undefined> {
    const events = await this.eventService.find({ _id: { $in: [...eventIds] } });
    if (!events.length) return undefined;

    const passcodeUpper = passcode.toUpperCase();

    for (const event of events) {
      const ldo = await this.ldoService.findByDirectorId(String(event.ldo));
      if (!ldo) continue;

      const users = await this.userService.find({
        $or: [{ _id: String(ldo.director) }, { role: UserRole.admin }],
      });

      const validPasscodes = users
        .map(u => u.passcode?.toUpperCase())
        .filter(Boolean);

      if (validPasscodes.includes(passcodeUpper)) {
        return passcode;
      }
    }

    return undefined;
  }

  async generateAuthResponse(
    user: User,
    loginUser: LoginUser,
    passcode?: string | null,
    message = 'A token has been issued successfully',
  ): Promise<LoginResponse> {
    const payload = {
      _id: user._id,
      email: user.email,
      role: loginUser.role,
      passcode: passcode || null,
    };

    const token = await this.jwtService.sign(payload);

    return {
      code: HttpStatus.ACCEPTED,
      success: true,
      message,
      data: { token, info: loginUser },
    };
  }




  handleInternalError(error: unknown): LoginResponse {
    console.error('Login Error:', error);

    if (error instanceof Error) {
      return AppResponse.handleError({
        code: 500,
        message: error.message,
      });
    }

    return AppResponse.handleError({
      code: 500,
      message: 'Unexpected error occurred',
    });
  }




}