import { Field, ObjectType } from "@nestjs/graphql";
import { AppResponse } from "src/shared/response";
import { Group, GroupPoints } from "../group.schema";

@ObjectType()
export class GetGroupsResponse extends AppResponse<Group[]> {
  @Field((_type) => [Group], { nullable: false })
  data?: Group[];
}

@ObjectType()
export class GetGroupResponse extends AppResponse<Group> {
  @Field((_type) => Group, { nullable: true })
  data?: Group;
}

@ObjectType()
export class CustomGroupPoints extends GroupPoints {
  @Field((_type) => String)
  team: string;

  @Field((_type) => String, {nullable: true})
  event: string;


}

@ObjectType()
export class GetGroupPointsResponse extends AppResponse {
  @Field(() => CustomGroupPoints, { nullable: true })
  data?: CustomGroupPoints;
}

@ObjectType()
export class GetGroupsPointsResponse extends AppResponse {
  @Field(() => [CustomGroupPoints], { nullable: true })
  data?: CustomGroupPoints[];
}