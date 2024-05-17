import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';

// https://docs.nestjs.com/graphql/resolvers#class-inheritance
@InputType()
export class CreateDirectorArgs {
  @Field({ nullable: false })
  firstName: string;

  @Field({ nullable: false })
  lastName: string;

  @Field({ nullable: true })
  phone: string;

  @Field({ nullable: false })
  email: string;

  @Field({ nullable: false })
  password: string;

  // LDO
  @Field({ nullable: true })
  name?: string;
}


@InputType()
export class UpdateDirectorArgs extends PartialType(CreateDirectorArgs) { }

@InputType()
export class UpdateUserArgs extends PartialType(CreateDirectorArgs) {
  @Field({ nullable: true })
  oldPassword: string;
}
