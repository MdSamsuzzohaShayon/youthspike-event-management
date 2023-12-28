import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateRoomInput {
    @Field()
    teamA: string;
    
    @Field()
    teamB: string;

    @Field({ nullable: true })
    match?: string;
}

@InputType()
export class UpdateRoomInput extends PartialType(CreateRoomInput) { }
