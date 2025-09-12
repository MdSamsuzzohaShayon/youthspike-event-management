import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { UserRole } from 'src/user/user.schema';
import { Event } from './event.schema';
import { EventMutations } from './resolvers/event.mutations';
import { EventQueries } from './resolvers/event.queries';
import { EventFields } from './resolvers/event.fields';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import {
  CreateEventInput,
  EventFilterInput,
  EventSponsorInput,
  EventSponsorStringInput,
  ProStatsInput,
  UpdateEventInput,
  UpdateProStatsInput,
} from './resolvers/event.input';
import {
  CreateOrUpdateEventResponse,
  GetEventDetailsResponse,
  GetEventResponse,
  GetEventsResponse,
  GetPlayerEventSettingResponse,
} from './resolvers/event.response';
import { Player } from 'src/player/player.schema';

@Resolver((of) => Event)
export class EventResolver {
  constructor(
    private eventMutations: EventMutations,
    private eventQueries: EventQueries,
    private eventFields: EventFields,
  ) {}

  // Mutations
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateEventResponse)
  async createEvent(
    @Args('sponsorsInput', { type: () => [EventSponsorInput] }) sponsorsInput: EventSponsorInput[],
    @Args('input') input: CreateEventInput,
    @Context() context: any,
    @Args('multiplayerInput', { nullable: true }) multiplayerInput?: ProStatsInput,
    @Args('weightInput', { nullable: true }) weightInput?: ProStatsInput,
    @Args('logo', { nullable: true, type: () => GraphQLUpload }) logo?: Upload,
  ) {
    return this.eventMutations.createEvent({
      sponsorsInput,
      input,
      context,
      multiplayerInput,
      weightInput,
      logo,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateEventResponse)
  async updateEvent(
    @Args('sponsorsInput', { type: () => [EventSponsorInput] }) sponsorsInput: EventSponsorInput[],
    @Args('updateInput') updateInput: UpdateEventInput,
    @Args('eventId') eventId: string,
    @Context() context: any,
    @Args('sponsorsStringInput', { nullable: true, type: () => [EventSponsorStringInput] })
    sponsorsStringInput?: EventSponsorStringInput[],
    @Args('multiplayerInput', { nullable: true }) multiplayerInput?: UpdateProStatsInput,
    @Args('weightInput', { nullable: true }) weightInput?: UpdateProStatsInput,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true }) logo?: Upload,
  ) {
    return this.eventMutations.updateEvent({
      sponsorsInput,
      updateInput,
      eventId,
      context,
      sponsorsStringInput,
      multiplayerInput,
      weightInput,
      logo,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateEventResponse)
  async cloneEvent(@Args({ name: 'eventId', type: () => String }) eventId: string, @Context() context: any) {
    return this.eventMutations.cloneEvent(eventId, context);
  }


  // Temporary
  @Mutation((_returns) => CreateOrUpdateEventResponse)
  async updateEventCache(@Args({ name: 'eventId', type: () => String }) eventId: string) {
    return this.eventMutations.updateEventCache(eventId);
  }



  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => GetEventResponse)
  async deleteEvent(@Context() context: any, @Args({ name: 'eventId', type: () => String }) eventId: string) {
    return this.eventMutations.deleteEvent(context, eventId);
  }

  // Queries
  @Query((__returns) => GetEventsResponse)
  async getEvents(@Context() context: any, @Args('directorId', { nullable: true }) directorId?: string) {
    return this.eventQueries.getEvents(context, directorId);
  }

  @Query((__returns) => GetEventDetailsResponse)
  async getEventDetails(@Args('eventId', { nullable: false }) eventId: string) {
    // , @Args('filter') filter: EventFilterInput
    return this.eventQueries.getEventDetails(eventId);
  }

  @Query((__returns) => GetPlayerEventSettingResponse)
  async getPlayerEventSetting(@Context() context: any, @Args('eventId', { nullable: true }) eventId: string) {
    return this.eventQueries.getPlayerEventSetting(context, eventId);
  }

  @Query((_returns) => GetEventResponse)
  async getEvent(@Args('eventId') eventId: string) {
    return this.eventQueries.getEvent(eventId);
  }

  // Field resolvers
  @ResolveField()
  async ldo(@Parent() event: Event) {
    return this.eventFields.ldo(event);
  }

  @ResolveField()
  async teams(@Parent() event: Event) {
    return this.eventFields.teams(event);
  }

  @ResolveField()
  async groups(@Parent() event: Event) {
    return this.eventFields.groups(event);
  }

  @ResolveField()
  async sponsors(@Parent() event: Event) {
    return this.eventFields.sponsors(event);
  }

  @ResolveField(() => [Player])
  async players(@Parent() event: Event) {
    return this.eventFields.players(event);
  }

  @ResolveField()
  async matches(@Parent() event: Event) {
    return this.eventFields.matches(event);
  }
}
