import { Field, ObjectType } from "@nestjs/graphql";
import { Badge } from "./badge.schema";

@ObjectType()
export class CustomBadge extends Badge {

    @Field((_type) => String, { nullable: false })
    event: string;

    @Field((_type) => [String], { nullable: true })
    teams: string[];

    @Field((_type) => [String], { nullable: true })
    players: string[];
}

