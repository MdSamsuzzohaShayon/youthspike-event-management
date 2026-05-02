/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { User, UserBase, UserRole } from './user.schema';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { Player } from 'src/player/player.schema';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateUser } from './user.input';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { rmInvalidProps } from 'src/utils/helper';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { EventService } from 'src/event/event.service';
import { LdoService } from 'src/ldo/ldo.service';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
import { Team } from 'src/team/team.schema';
const GraphQLUpload = GraphQLUploadModule.default;

@ObjectType()
class LoginUser extends UserBase {
  @Field((type) => [String], { nullable: true })
  events: string[];

  @Field((type) => String, { nullable: true })
  team?: string;

  @Field((type) => String, { nullable: true })
  teamLogo?: string;

  @Field((type) => String, { nullable: true })
  teamId?: string;

  @Field((type) => String, { nullable: true })
  captainplayer?: string;

  @Field((type) => String, { nullable: true })
  cocaptainplayer?: string;

  @Field((type) => String, { nullable: true })
  player?: string;
}

@ObjectType()
class LoginResponseData {
  @Field()
  token: string;

  @Field()
  info: LoginUser;
}


@ObjectType()
class LoginResponse extends AppResponse<LoginResponseData> {
  @Field((type) => LoginResponseData, { nullable: true })
  data?: LoginResponseData;
}

@ObjectType()
class UserResponse extends AppResponse<User> {
  @Field((type) => User, { nullable: true })
  data?: User;
}

@Resolver((of) => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private playerService: PlayerService,
    private teamService: TeamService,
    private eventService: EventService,
    private ldoService: LdoService,
    private jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }


  // helper functions
  private async findOrCreateUser(email: string, password: string): Promise<User | null> {
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


  private async verifyPassword(input: string, hash: string): Promise<boolean> {
    return bcrypt.compare(input, hash);
  }


  private buildLoginUser(user: User): LoginUser {
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

  private isPrivilegedRole(role: UserRole): boolean {
    return role === UserRole.admin || role === UserRole.director;
  }
  
  private extractPlayerId(user: LoginUser): string | null {
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


  private async findTeamByRole(role: UserRole, playerId: string) {
    const queryMap = {
      [UserRole.captain]: { $or: [{ captainplayer: playerId }, { captain: playerId }] },
      [UserRole.co_captain]: { $or: [{ cocaptainplayer: playerId }, { cocaptain: playerId }] },
      [UserRole.player]: { players: playerId },
    };
  
    return this.teamService.findOne(queryMap[role] || {});
  }


  private getMatchedEvents(playerEvents: string[] = [], teamEvents: string[] = []): Set<string> {
    const teamEventSet = new Set(teamEvents.map(String));
    return new Set(playerEvents.map(String).filter(e => teamEventSet.has(e)));
  }


  private attachTeamInfo(user: LoginUser, team: Team): void {
    user.team = team.name;
    user.teamLogo = team.logo;
  
    if (user.role === UserRole.captain || user.role === UserRole.co_captain) {
      user.teamId = team._id;
    }
  }


  private async validatePasscode(passcode: string, eventIds: Set<string>): Promise<string | undefined> {
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

  private async generateAuthResponse(
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




  private handleInternalError(error: unknown): LoginResponse {
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


  // Mutations
  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('passcode', { nullable: true }) passcode?: string,
  ): Promise<LoginResponse> {
    try {
      const user = await this.findOrCreateUser(email, password);
      if (!user) return AppResponse.invalidCredentials();
  
      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) return AppResponse.invalidCredentials();
  
      const loginUser = this.buildLoginUser(user);
  
      // ⚡ Early return for admin/director
      if (this.isPrivilegedRole(loginUser.role)) {
        return this.generateAuthResponse(user, loginUser, null, 'Token issued successfully for admin/director');
      }
  
      const playerId = this.extractPlayerId(loginUser);
      if (!playerId) return AppResponse.notFound('Player');
  
      const team = await this.findTeamByRole(loginUser.role, playerId);
      if (!team) return AppResponse.notFound('Team');
  
      const player = await this.playerService.findById(playerId);
      if (!player) return AppResponse.notFound('Player');
  
      const matchedEvents = this.getMatchedEvents(player.events as string[], team.events as string[]);
      if (matchedEvents.size === 0) {
        return AppResponse.handleError({ code: 406, message: 'Player event and team event did not match' });
      }
  
      this.attachTeamInfo(loginUser, team);
  
      if (passcode) {
        loginUser.passcode = await this.validatePasscode(passcode, matchedEvents);
      }
  
      return this.generateAuthResponse(user, {...loginUser, events: [...matchedEvents] as string[]}, loginUser.passcode);
    } catch (error) {
      return this.handleInternalError(error);
    }
  }



  @Query((_returns) => UserResponse)
  async getUser(@Args('userId') userId: string) {
    try {
      const userExist: any = await this.userService.findById(userId);
      if (!userExist) return AppResponse.notFound('User');
      const userObj = { ...userExist };
      delete userObj.password;
      return {
        code: HttpStatus.OK,
        success: true,
        data: userObj,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((_returns) => UserResponse)
  async updateUser(
    @Args({ name: 'userId', type: () => String, nullable: false }) userId: string,
    @Args('updateInput') updateInput: UpdateUser,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true }) profile?: Promise<FileUpload>,

  ) {
    try {
      const userExist = await this.userService.findById(userId);
      if (!userExist) return AppResponse.notFound('User');

      // Upload image to cloudinary
      let profileUrl: string | null = null;
      if (profile) profileUrl = await this.cloudinaryService.uploadFiles(profile);

      const userObj = rmInvalidProps(updateInput);
      const newUserObj = { ...userObj };
      if (newUserObj.password && updateInput.oldPassword) {
        const isValid = await bcrypt.compare(updateInput.oldPassword, userExist.password);
        delete newUserObj.oldPassword;
        if (isValid) {
          const salt = await bcrypt.genSalt(10);
          newUserObj.password = await bcrypt.hash(newUserObj.password, salt);
        } else {
          delete newUserObj.password;
        }
      } else {
        delete newUserObj.password;
      }
      if (profileUrl && userExist.captainplayer) {
        await this.playerService.updateOne({ _id: userExist.captainplayer.toString() }, { profile: profileUrl });
      }
      if (profileUrl && userExist.cocaptainplayer) {
        await this.playerService.updateOne({ _id: userExist.cocaptainplayer.toString() }, { profile: profileUrl });
      }

      if (newUserObj.email) delete newUserObj.email;
      const director = await this.userService.createOrUpdate(newUserObj, userId);
      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'The user has been updated successfully!',
        data: director,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  /**
   * POPULATE
   * ===============================================================================================
   */
  @ResolveField(() => Player, { nullable: true })
  async captainplayer(@Parent() user: User) {
    try {
      if (user.captainplayer) {
        const captain = await this.playerService.findById(user.captainplayer.toString());
        return captain || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  @ResolveField(() => Player, { nullable: true })
  async cocaptainplayer(@Parent() user: User) {
    try {
      if (user.cocaptainplayer) {
        const cocaptain = await this.playerService.findById(user.cocaptainplayer.toString());
        return cocaptain || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
