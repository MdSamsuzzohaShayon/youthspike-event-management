/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Mutation, ObjectType, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { User, UserBase, UserRole } from './user.schema';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { Player } from 'src/player/player.schema';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


@ObjectType()
class LoginUser extends UserBase {
  @Field((type) => String, { nullable: true })
  event?: string;

  @Field((type) => String, { nullable: true })
  captainplayer?: string;
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
  constructor(private readonly userService: UserService, private playerService: PlayerService, private teamService: TeamService, private jwtService: JwtService) { }

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
  
      if(userObj.role === UserRole.captain && userObj.captainplayer){
        const teamWithCaptain = await this.teamService.findOne({captain: userObj.captainplayer.toString()});
        if(teamWithCaptain){
          userObj.event = teamWithCaptain.event;
        }
      }
  
      const token = await this.jwtService.sign({ _id: existingUser._id, email: existingUser.email, role: userObj.role });
      return {
        code: 202,
        success: true,
        data: {token, user: userObj}
        // data: user && user.length > 0 ? user[0] : null,
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
}
