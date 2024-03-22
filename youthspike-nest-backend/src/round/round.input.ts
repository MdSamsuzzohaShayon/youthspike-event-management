import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateRoundInput{
    @Field(()=> String)
    roundId: string;

    @Field(()=> String)
    matchId: string;

    @Field(()=> [String], {nullable: true})
    subs: string[];
}