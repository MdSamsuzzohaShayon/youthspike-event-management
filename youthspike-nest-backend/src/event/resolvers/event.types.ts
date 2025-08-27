import { CreateEventInput, EventSponsorInput, EventSponsorStringInput, ProStatsInput, UpdateEventInput, UpdateProStatsInput } from "./event.input";
import { CreateOrUpdateEventResponse, GetEventDetailsResponse, GetEventResponse, GetEventsResponse, GetPlayerEventSettingResponse } from "./event.response";

export interface EventResolverContext {
  req: any;
  res: any;
}

export interface EventMutationArgs {
  sponsorsInput: EventSponsorInput[];
  input: CreateEventInput;
  context: any;
  multiplayerInput?: ProStatsInput;
  weightInput?: ProStatsInput;
  statsInput?: ProStatsInput;
  logo?: any;
}

export interface EventUpdateArgs extends Omit<EventMutationArgs, 'multiplayerInput' | 'weightInput' | 'statsInput'> {
  updateInput: UpdateEventInput;
  eventId: string;
  sponsorsStringInput?: EventSponsorStringInput[];
  multiplayerInput?: UpdateProStatsInput;
  weightInput?: UpdateProStatsInput;
  statsInput?: UpdateProStatsInput;
}

export interface IEventMutations {
  createEvent(args: EventMutationArgs): Promise<CreateOrUpdateEventResponse>;
  updateEvent(args: EventUpdateArgs): Promise<CreateOrUpdateEventResponse>;
  cloneEvent(eventId: string, context: any): Promise<CreateOrUpdateEventResponse>;
  deleteEvent(context: any, eventId: string): Promise<GetEventResponse>;
}

export interface IEventQueries {
  getEvents(context: any, directorId?: string): Promise<GetEventsResponse>;
  getEventDetails(eventId: string): Promise<GetEventDetailsResponse>;
  getPlayerEventSetting(context: any, eventId: string): Promise<GetPlayerEventSettingResponse>;
  getEvent(eventId: string): Promise<GetEventResponse>;
}