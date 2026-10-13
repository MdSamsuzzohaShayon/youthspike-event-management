import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AppResponse } from 'src/shared/response';
import { User, UserBase } from '../user.schema';



@ObjectType()
export class LoginUser extends UserBase {
  @Field((_type) => [String], { nullable: true })
  events: string[];

  @Field((_type) => String, { nullable: true })
  team?: string;

  @Field((_type) => String, { nullable: true })
  teamLogo?: string;

  @Field((_type) => String, { nullable: true })
  teamId?: string;

  @Field((_type) => String, { nullable: true })
  captainplayer?: string;

  @Field((_type) => String, { nullable: true })
  cocaptainplayer?: string;

  @Field((_type) => String, { nullable: true })
  player?: string;
}

@ObjectType()
export class LoginResponseData {
  @Field()
  token: string;

  @Field()
  info: LoginUser;
}


@ObjectType()
export class LoginResponse extends AppResponse<LoginResponseData> {
  @Field((_type) => LoginResponseData, { nullable: true })
  data?: LoginResponseData;
}

@ObjectType()
export class UserResponse extends AppResponse<User> {
  @Field((_type) => User, { nullable: true })
  data?: User;
}
