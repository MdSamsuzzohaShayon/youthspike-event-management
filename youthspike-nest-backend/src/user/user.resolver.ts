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
import { UpdateDirectorArgs, UpdateUserArgs } from './user.args';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import * as Upload from 'graphql-upload/Upload.js';
import { rmInvalidProps } from 'src/util/helper';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';


@ObjectType()
class LoginUser extends UserBase {
  @Field((type) => String, { nullable: true })
  event?: string;

  @Field((type) => String, { nullable: true })
  team?: string;

  @Field((type) => String, { nullable: true })
  captainplayer?: string;

  @Field((type) => String, { nullable: true })
  cocaptainplayer?: string;
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

@ObjectType()
class ChangePWDDataRes extends AppResponse<ChangePWDData> {
  @Field((type) => ChangePWDData, { nullable: true })
  data?: ChangePWDData;
}

@Resolver((of) => User)
export class UserResolver {
  constructor(private readonly userService: UserService, private playerService: PlayerService, private teamService: TeamService, private jwtService: JwtService, private readonly cloudinaryService: CloudinaryService) { }

  @Mutation((returns) => LoginResponse)
  async login(@Args('email') email: string, @Args('password') password: string): Promise<LoginResponse> {
    try {
      const existingUser: any = await this.userService.findOne({ email });
      if (!existingUser) return AppResponse.invalidCredentials();
      const passwordFromUser = existingUser.password;
      const passwordMatched = await bcrypt.compare(password, passwordFromUser);
      if (!passwordMatched) return AppResponse.invalidCredentials();

      const userObj = { ...existingUser._doc };
      delete userObj.password;

      if (userObj.role === UserRole.captain && userObj.captainplayer) {
        const teamWithCaptain = await this.teamService.findOne({ captain: userObj.captainplayer.toString() });
        if (teamWithCaptain) {
          userObj.event = teamWithCaptain.event;
          userObj.team = teamWithCaptain.name;
        }
      }

      if (userObj.role === UserRole.co_captain && userObj.cocaptainplayer) {
        const teamWithCoCaptain = await this.teamService.findOne({ cocaptain: userObj.cocaptainplayer.toString() });
        if (teamWithCoCaptain) {
          userObj.event = teamWithCoCaptain.event;
          userObj.team = teamWithCoCaptain.name;
        }
      }

      const token = await this.jwtService.sign({ _id: existingUser._id, email: existingUser.email, role: userObj.role });
      return {
        code: 202,
        success: true,
        data: { token, user: userObj },

        // data: user && user.length > 0 ? user[0] : null,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Query((returns) => UserResponse)
  async getUser(@Args('userId') userId: string) {
    try {
      const userExist: any = await this.userService.findById(userId);
      const userObj = { ...userExist._doc };
      delete userObj.password;
      return {
        code: userExist ? 200 : 404,
        success: true,
        message: "Has message",
        data: userObj,

      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain)
  @Mutation((returns) => UserResponse)
  async updateUser(
    @Args({ name: 'userId', type: () => String, nullable: false }) userId: string,
    @Args('updateInput') updateInput: UpdateUserArgs,
    @Args({ name: 'profile', type: () => GraphQLUpload, nullable: true }) profile?: Upload,
  ) {
    try {

      const userExist = await this.userService.findById(userId);
      if (!userExist) return AppResponse.exists("User");

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
        await this.playerService.updateOne({_id: userExist.captainplayer.toString()}, { profile: profileUrl });
      }
      if (profileUrl && userExist.cocaptainplayer) {
        await this.playerService.updateOne({_id: userExist.cocaptainplayer.toString()}, { profile: profileUrl });
      }

      if (newUserObj.email) delete newUserObj.email;
      const director = await this.userService.createOrUpdate(newUserObj, userId);
      return {
        code: 201,
        success: true,
        data: director,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Mutation((returns) => ChangePWDDataRes)
  async changePassword(
    @Args('id') id: string,
    @Args('oldPassword', { nullable: true }) oldPassword: string,
    @Args('newPassword', { nullable: true }) newPassword: string,
  ): Promise<ChangePWDDataRes> {
    try {
      const user = await this.userService.findById(id);
      const isValid = await bcrypt.compare(oldPassword, user?.password);
      if (isValid) {
        user.password = newPassword;
        user.save();
      }
      return {
        code: isValid ? 200 : 300,
        success: true,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  /**
   * Populate data
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
