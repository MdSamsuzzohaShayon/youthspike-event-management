import { Field, InputType, PartialType } from '@nestjs/graphql';

// https://docs.nestjs.com/graphql/resolvers#class-inheritance
@InputType()
export class CreateDirector {
  @Field((_type) => String, { nullable: false })
  firstName: string;

  @Field((_type) => String, { nullable: false })
  lastName: string;

  @Field((_type) => String, { nullable: true })
  phone: string;

  @Field((_type) => String, { nullable: false })
  email: string;

  @Field((_type) => String, { nullable: false })
  password: string;

  @Field((_type) => String, { nullable: false })
  passcode: string;

  // LDO
  @Field((_type) => String, { nullable: true })
  name?: string;
}

@InputType()
export class UpdateDirector extends PartialType(CreateDirector) {}

@InputType()
export class UpdateUser extends PartialType(CreateDirector) {
  @Field({ nullable: true })
  oldPassword: string;
}
