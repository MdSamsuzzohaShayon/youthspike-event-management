/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExecutionContext, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  Int,
  Mutation,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';
import { Stream } from 'stream';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { AppResponse } from 'src/shared/response';
import { UserRole } from 'src/user/user.schema';
import { Event } from './event.schema';
import { EventService } from './event.service';
import { TeamService } from 'src/team/team.service';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import { CreateEventInput, EventSponsorInput, UpdateEventInput } from './event.args';
import { tokenToUser } from 'src/util/helper';
import { UserService } from 'src/user/user.service';
import { LdoService } from 'src/ldo/ldo.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { SponsorService } from 'src/sponsor/sponsor.service';

interface JwtPayload {
  _id: string;
  // Add other properties if necessary
}

@ObjectType()
class CreateOrUpdateEventResponse extends AppResponse<Event> {
  @Field((type) => Event, { nullable: true })
  data?: Event;
}

@ObjectType()
class GetEventsResponse extends AppResponse<Event[]> {
  @Field((type) => [Event], { nullable: false })
  data?: Event[];
}

@ObjectType()
class GetEventResponse extends AppResponse<Event> {
  @Field((type) => Event, { nullable: false })
  data?: Event;
}

@Resolver((of) => Event)
export class EventResolver {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private ldoService: LdoService,
    private cloudinaryService: CloudinaryService,
    private playerService: PlayerService,
    private matchService: MatchService,
    private userService: UserService,
    private sponsorService: SponsorService,
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => CreateOrUpdateEventResponse)
  async createEvent(
    // @Args({ name: 'sponsors', type: () => [GraphQLUpload] }) sponsors: Upload[],
    @Args('sponsorsInput', { type: () => [EventSponsorInput] }) sponsorsInput: EventSponsorInput[],
    @Args('input') args: CreateEventInput,
    @Context() context: any,
  ): Promise<CreateOrUpdateEventResponse> {
    try {
      /**
       * TODO:
       *  Step-1: Get user id from token if not logged in as admin
       *  Step-2: Create a new director and use that as user id if logged in as admin (LDO) / If logged in user is a admin he must attached ldo or director id
       *  Step-3: Upload file to cloudinary and save url to the database
       *  Step-4: Add ldo id to event and push event id to ldo events array
       */

      // Get user id
      const secret = this.configService.get<string>('JWT_SECRET');
      const userId = tokenToUser(context, secret);

      // Get user
      const loggedUser = await this.userService.findById(userId);
      if (!loggedUser) return AppResponse.unauthorized();

      // If the user is admin we must need ldoId otherwise get id from token
      let directorId = null;
      if (loggedUser.role === UserRole.director) {
        directorId = loggedUser._id;
      } else if (loggedUser.role === UserRole.admin) {
        if (!args.ldo) {
          return AppResponse.handleError({
            name: 'Invalid LDO',
            message: 'You must provide a LDO id in order to create an Event!',
          });
        }
        directorId = args.ldo;
      }
      const findLdo = await this.ldoService.findByDirectorId(directorId);
      if (!findLdo)
        return AppResponse.handleError({
          name: 'No LDO',
          message: 'User need to be in league director organization in order to create an Event!',
        });

      // Upload file to cloudinary
      const uploadPromises = [];
      for (let i = 0; i < sponsorsInput.length; i++) {
        uploadPromises.push(this.cloudinaryService.uploadSponsors(sponsorsInput[i].logo, sponsorsInput[i].company));
      }
      const sponsorsFileList = await Promise.all(uploadPromises);

      let sponsorsIds = [];
      if (sponsorsFileList) {
        const sponsors = await this.sponsorService.insertMany(sponsorsFileList);
        sponsorsIds = sponsors.map((s) => s._id);
      }

      // Arrange data and save to database
      const eventData = {
        ...args,
        ldo: findLdo._id,
        sponsors: sponsorsIds,
        players: [],
        teams: [],
        matches: [],
      };

      const savedEvent = await this.eventService.create(eventData);
      await Promise.all([
        this.ldoService.update({ events: [savedEvent._id.toString()] }, findLdo._id.toString()),
        this.sponsorService.updateMany({ _id: { $in: sponsorsIds } }, { event: savedEvent._id })
      ]);
      

      return {
        data: savedEvent,
        success: true,
        code: 201,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => CreateOrUpdateEventResponse)
  async updateEvent(
    @Args({ name: 'sponsors', type: () => [GraphQLUpload] }) sponsors: Upload[],
    @Args('input') args: UpdateEventInput,
    @Args('eventId') eventId: string,
    @Context() context: any,
  ): Promise<CreateOrUpdateEventResponse> {
    try {
      /**
       * TODO:
       *  Step-1: Get user id from token if not logged in as admin
       *  Step-2: Check files are updated or not
       *  Step-3: If files are updated then Upload file to cloudinary and save url to the database
       *  Step-4: Check director is updating his own event
       */
      const secret = this.configService.get<string>('JWT_SECRET');
      const userId = tokenToUser(context, secret);

      // Get user
      const loggedUser = await this.userService.findById(userId);
      if (!loggedUser) return AppResponse.unauthorized();

      // If the user is admin we must need ldoId otherwise get id from token
      let directorId = null;
      if (loggedUser.role === UserRole.director) {
        directorId = loggedUser._id;
      } else if (loggedUser.role === UserRole.admin) {
        if (!args.ldo)
          return AppResponse.handleError({
            name: 'No Director',
            message: 'You must select a director in order to update a event!',
          });
        directorId = args.ldo;
      }

      // Upload file to cloudinary
      const uploadPromises = [];
      for (let i = 0; i < sponsors.length; i++) {
        if (typeof sponsors[i] !== 'string') uploadPromises.push(this.cloudinaryService.uploadFiles(sponsors[i]));
      }
      const cloudinaryUrls: string[] = await Promise.all(uploadPromises);

      // Arrange data and save to database
      const eventData = {
        ...args,
        directorId: directorId,
        sponsors: cloudinaryUrls,
      };

      const updatedEvent = await this.eventService.update(eventData, eventId);
      // const updateLdo = await this.ldoService.update({ events: [updatedEvent._id] }, findLdo._id);

      return {
        data: updatedEvent,
        success: true,
        code: 202,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => CreateOrUpdateEventResponse)
  async cloneEvent(
    @Args({ name: 'eventId', type: () => String }) eventId: string,
    @Context() context: any,
  ): Promise<CreateOrUpdateEventResponse> {
    /**
     * TODO:
     * Step-1: Check user role
     * Step-2: If user is admin let him allow any event he wants
     * Step-3: If user is admin create a new ldo user and assign him to new event
     * Step-4: If user is director let him allow to clone only those events which he has created
     */
    // Get User
    const secret = this.configService.get<string>('JWT_SECRET');
    const userId = tokenToUser(context, secret);
    const loggedUser = await this.userService.findById(userId);
    if (!loggedUser) return AppResponse.unauthorized();

    // Role Check
    let findEvent = null;
    if (loggedUser.role === UserRole.director) {
      findEvent = await this.eventService.findOne({ $and: [{ _id: eventId }, { directorId: userId }] });
    } else if (loggedUser.role === UserRole.admin) {
      findEvent = await this.eventService.findById(eventId);
    }
    if (!findEvent) return AppResponse.notFound(findEvent.name);

    // Clone
    const eventObj = { ...findEvent._doc };
    eventObj.name = eventObj.name + ' Clone';
    delete eventObj._id;
    const clonedEvent = await this.eventService.create(eventObj);

    return {
      data: clonedEvent,
      success: true,
      code: 201,
    };
  }

  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetEventsResponse)
  async getEvents(@Context() context: any, @Args('directorId', { nullable: true }) directorId?: string) {
    /**
     * TODO:
     *  Step-1: Check role
     *  Step-2: Must need director id if logged is as admin
     *  Step-3: Find all events according to director id
     */
    const secret = this.configService.get<string>('JWT_SECRET');
    const userId = tokenToUser(context, secret);

    // Get user
    const loggedUser = await this.userService.findById(userId);
    if (!loggedUser) return AppResponse.unauthorized();

    // If the user is admin we must need ldoId otherwise get id from token
    let newDirectorId = null;
    if (loggedUser.role === UserRole.director) {
      newDirectorId = loggedUser._id;
    } else if (loggedUser.role === UserRole.admin) {
      if (!directorId)
        return AppResponse.handleError({
          name: 'No Director',
          message: 'You must select a director in order to update a event!',
        });
      newDirectorId = directorId;
    }

    const events = await this.eventService.query({ directorId: newDirectorId });

    try {
      return {
        code: 200,
        success: true,
        data: events,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Query((returns) => GetEventResponse)
  async getEvent(@Args('eventId') eventId: string) {
    try {
      const findEvent = await await this.eventService.findById(eventId);
      return {
        code: 200,
        success: true,
        data: findEvent,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Roles(UserRole.admin)
  @Query((returns) => GetEventResponse)
  async getEventByName(@Args('name') name: string) {
    try {
      return {
        code: 200,
        success: true,
        data: await this.eventService.findByName(name),
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @ResolveField()
  async ldo(@Parent() event: Event) {
    return this.ldoService.findByDirectorId(event.ldo.toString());
  }

  @ResolveField()
  async teams(@Parent() event: Event) {
    return this.teamService.query({ _id: { $in: event.teams } });
  }

  @ResolveField()
  async sponsors(@Parent() event: Event) {
    return this.sponsorService.query({ _id: { $in: event.sponsors } });
  }

  @ResolveField()
  async players(@Parent() event: Event) {
    return this.playerService.query({ _id: { $in: event.players } });
  }

  @ResolveField()
  async matches(@Parent() event: Event) {
    return this.matchService.query({ _id: { $in: event.matches } });
  }
}
