import { Field, ObjectType } from "@nestjs/graphql";
import { AppResponse } from "src/shared/response";
import { Net } from "./net.schema";

@ObjectType()
export class GetNetsResponse extends AppResponse<Net[]> {
  @Field((type) => [Net], { nullable: false })
  data?: Net[];
}

@ObjectType()
export class GetNetResponse extends AppResponse<Net> {
  @Field((type) => Net, { nullable: false })
  data?: Net;
}