import { CreateEventBody, UpdateEventBody } from "./event.input";
import { CreateOrUpdateEventResponse, GetEventDetailsResponse, GetEventResponse, GetEventsResponse, GetPlayerEventSettingResponse } from "./event.response";

export interface EventResolverContext {
  req: any;
  res: any;
}

export interface IEventMutations {
  createEvent(body: CreateEventBody): Promise<CreateOrUpdateEventResponse>;
  updateEvent(body: UpdateEventBody): Promise<CreateOrUpdateEventResponse>;
  cloneEvent(eventId: string, context: any): Promise<CreateOrUpdateEventResponse>;
  deleteEvent(context: any, eventId: string): Promise<GetEventResponse>;
}

export interface IEventQueries {
  getEvents(context: any, directorId?: string): Promise<GetEventsResponse>;
  getEventDetails(eventId: string): Promise<GetEventDetailsResponse>;
  getPlayerEventSetting(context: any, eventId: string): Promise<GetPlayerEventSettingResponse>;
  getEvent(eventId: string): Promise<GetEventResponse>;
}