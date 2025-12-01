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
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import { UpdateUser } from './user.input';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { rmInvalidProps } from 'src/utils/helper';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { EventService } from 'src/event/event.service';
import { LdoService } from 'src/ldo/ldo.service';

@ObjectType()
class LoginUser extends UserBase {
  @Field((type) => String, { nullable: true })
  event?: string;

  @Field((type) => String, { nullable: true })
  team?: string;

  @Field((type) => String, { nullable: true })
  teamLogo?: string;

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
  user: LoginUser;
}

@ObjectType()
class ChangePWDData {
  @Field()
  updated: boolean;
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
  ) {}

  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('passcode', { nullable: true }) passcode?: string,
  ): Promise<LoginResponse> {
    try {
      // 1️⃣ Find user by email (case-insensitive)
      let existingUser: any = await this.userService.findOne({ email: { $regex: new RegExp(email, 'i') } });

      // 2️⃣ If no user exists, try to create one from player data
      if (!existingUser) {
        const playerExist = await this.playerService.findOne({ username: email });
        if (!playerExist) return AppResponse.invalidCredentials();

        const eventOfPlayer = await this.eventService.findOne({ teams: { $in: playerExist.teams } });
        const newPassword = eventOfPlayer?.coachPassword || password;

        existingUser = await this.userService.create({
          active: true,
          email,
          firstName: playerExist.firstName,
          lastName: playerExist.lastName,
          password: newPassword,
          role: UserRole.player,
          player: playerExist._id,
        });
      }

      // 3️⃣ Validate password
      const passwordMatched = await bcrypt.compare(password, existingUser.password);
      if (!passwordMatched) return AppResponse.invalidCredentials();

      // 4️⃣ Prepare user object (without password)
      const userObj = { ...existingUser._doc };
      delete userObj.password;

      /**
       * ⚡ EARLY RETURN for admin/director
       * ---------------------------------------------------
       * No need to fetch player, team, or event for admin/director
       */
      if (userObj.role === UserRole.admin || userObj.role === UserRole.director) {
        const payload = {
          _id: existingUser._id,
          email: existingUser.email,
          role: userObj.role,
          passcode: null,
        };

        const token = await this.jwtService.sign(payload);

        return {
          code: HttpStatus.ACCEPTED,
          success: true,
          message: 'Token issued successfully for admin/director',
          data: { token, user: userObj },
        };
      }

      /**
       * TEAM LOOKUP (optimized)
       * -------------------------------------------------------
       * - Determine playerId (captain/co_captain/player)
       * - Query team only once
       */
      let playerId: string | null = null;
      if (userObj.role === UserRole.captain) playerId = userObj.captainplayer;
      else if (userObj.role === UserRole.co_captain) playerId = userObj.cocaptainplayer;
      else if (userObj.role === UserRole.player) playerId = userObj.player;

      let teamExist = null;
      if (playerId) {
        const teamQuery =
          userObj.role === UserRole.captain
            ? { $or: [{ captainplayer: playerId }, { captain: playerId }] }
            : userObj.role === UserRole.co_captain
            ? { $or: [{ cocaptainplayer: playerId }, { cocaptain: playerId }] }
            : { players: playerId };

        teamExist = await this.teamService.findOne(teamQuery);
      }

      if (!playerId) return AppResponse.notFound('Captain player');
      if (!teamExist) return AppResponse.notFound('Team');

      // Fetch player to check event consistency
      const playerExist = await this.playerService.findById(playerId);
      if (!playerExist) return AppResponse.notFound('Player');

      if (playerExist.events?.[0]?.toString() !== teamExist.event.toString()) {
        console.log('Player event and team event did not match', {
          playerEvent: playerExist.events[0],
          teamEvent: teamExist.event,
        });
      }

      // Attach team/event info to user
      userObj.event = playerExist.events?.[0]?.toString();
      userObj.team = teamExist.name;
      userObj.teamLogo = teamExist.logo;

      /**
       * PASSCODE MATCHING (unchanged but optimized)
       * -------------------------------------------------------
       * - Only runs if player has event + passcode was provided
       */
      if (playerId && userObj.event) {
        const eventExist = await this.eventService.findById(userObj.event);
        if (eventExist?.ldo) {
          const ldoExist = await this.ldoService.findByDirectorId(eventExist.ldo.toString());
          if (ldoExist) {
            const directorUsers = await this.userService.find({
              $or: [{ _id: ldoExist.director.toString() }, { role: UserRole.admin }],
            });

            if (passcode) {
              const passcodeList = directorUsers.map((du) => du.passcode?.toUpperCase()).filter(Boolean);

              if (passcodeList.includes(passcode.toUpperCase())) {
                userObj.passcode = passcode;
              }
            }
          }
        }
      }

      // 5️⃣ Issue JWT token
      const payload = {
        _id: existingUser._id,
        email: existingUser.email,
        role: userObj.role,
        passcode: userObj.passcode || null,
      };
      const token = await this.jwtService.sign(payload);

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A token has been issued successfully, you can authenticate with this!',
        data: { token, user: userObj },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @Query((returns) => UserResponse)
  async getUser(@Args('userId') userId: string) {
    try {
      const userExist: any = await this.userService.findById(userId);
      if (!userExist) return AppResponse.notFound('User');
      const userObj = { ...userExist._doc };
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
  @Mutation((returns) => UserResponse)
  async updateUser(
    @Args({ name: 'userId', type: () => String, nullable: false }) userId: string,
    @Args('updateInput') updateInput: UpdateUser,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true }) profile?: Upload,
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
