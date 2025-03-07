import { Field, ObjectType } from '@nestjs/graphql';
import { EventMatches } from 'src/match/match.response';
import { CustomPlayer } from 'src/player/player.response';
import { AppResponse } from 'src/shared/response';
import { Sponsor } from 'src/sponsor/sponsor.schema';
import { Event } from './event.schema';

@ObjectType()
export class CreateOrUpdateEventResponse extends AppResponse<Event> {
  @Field((type) => Event, { nullable: true })
  data?: Event;
}

@ObjectType()
export class GetEventsResponse extends AppResponse<Event[]> {
  @Field((type) => [Event], { nullable: true })
  data?: Event[];
}

@ObjectType()
export class GetEventResponse extends AppResponse<Event> {
  @Field((type) => Event, { nullable: true })
  data?: Event | null;
}


@ObjectType()
export class EventDetails extends EventMatches {
  @Field((_type) => [CustomPlayer], { nullable: false })
  players: CustomPlayer[];

  @Field((_type) => [Sponsor], { nullable: false })
  sponsors: Sponsor[];
}

@ObjectType()
export class GetEventDetailsResponse extends AppResponse<EventDetails> {
  @Field((_type) => EventDetails, { nullable: true })
  data?: EventDetails | null;
}
