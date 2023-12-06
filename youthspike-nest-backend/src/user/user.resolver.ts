/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { Coach, User, UserRole } from './user.schema';
import { UserService } from './user.service';
import { compare, hash } from 'bcrypt';

@ObjectType()
class LoginResponseData {
  @Field()
  token: string;

  @Field()
  user: User;
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
class ChangePWDDataRes extends AppResponse<ChangePWDData> {
  @Field((type) => ChangePWDData, { nullable: true })
  data?: ChangePWDData;
}

@Resolver((of) => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Mutation((returns) => LoginResponse)
  async login(@Args('email') email: string, @Args('password') password: string): Promise<LoginResponse> {
    try {
      const user = await this.userService.login({
        email,
        password,
      });
      return {
        code: 200,
        success: true,
        data: user,
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
      const isValid = await compare(oldPassword, user?.login?.password);
      if (isValid) {
        user.login.password = newPassword;
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
}
