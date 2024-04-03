/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExecutionContext, HttpStatus, UseGuards } from '@nestjs/common';
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
import * as bcrypt from 'bcrypt';
import { CreateEventInput, EventSponsorInput, UpdateEventInput } from './event.args';
import { tokenToUser } from 'src/util/helper';
import { UserService } from 'src/user/user.service';
import { LdoService } from 'src/ldo/ldo.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { FilterQuery } from 'mongoose';


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
    @Args('sponsorsInput', { type: () => [EventSponsorInput] }) sponsorsInput: EventSponsorInput[],
    @Args('input') args: CreateEventInput,
    @Context() context: any,
    @Args("logo", { nullable: true, type: () => GraphQLUpload }) logo?: Upload,
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
            success: false,
            message: 'You must provide a LDO id in order to create an Event!',
          });
        }
        directorId = args.ldo;
      }
      const findLdo = await this.ldoService.findByDirectorId(directorId);
      if (!findLdo)
        return AppResponse.handleError({
          success: false,
          message: 'User need to be in league director organization in order to create an Event!',
        });

      // Upload sponsors file to cloudinary
      const uploadPromises = [];
      for (let i = 0; i < sponsorsInput.length; i++) {
        uploadPromises.push(this.cloudinaryService.uploadSponsors(sponsorsInput[i].logo, sponsorsInput[i].company));
      }
      const sponsorsFileList = await Promise.all(uploadPromises);

      let sponsorsIds = [];
      if (sponsorsFileList && sponsorsFileList.length > 0) {
        const sponsors = await this.sponsorService.insertMany(sponsorsFileList);
        sponsorsIds = sponsors.map((s) => s._id);
      }

      // Upload image to cloudinary
      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);

      // Arrange data and save to database
      const eventData = {
        ...args,
        ldo: findLdo._id,
        logo: logoUrl,
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
        message: 'Event has been created successfully.',
        code: HttpStatus.CREATED,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => CreateOrUpdateEventResponse)
  async updateEvent(
    @Args({ name: 'sponsorsInput', type: () => [GraphQLUpload] }) sponsorsInput: Upload[],
    @Args('input') args: UpdateEventInput,
    @Args('eventId') eventId: string,
    @Context() context: any,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true }) logo?: Upload,
  ): Promise<CreateOrUpdateEventResponse> {
    try {
      /**
       * TODO:
       *  Step-1: Get user id from token if not logged in as admin
       *  Step-2: Check files are updated or not
       *  Step-3: If files are updated then Upload file to cloudinary and save url to the database
       *  Step-4: Check director is updating his own event
       *  Step-5: Check division update and all other module that assigned the same division update that
       */
      const secret = this.configService.get<string>('JWT_SECRET');
      const userId = tokenToUser(context, secret);

      // Get user
      const [loggedUser, eventExist] = await Promise.all([this.userService.findById(userId), this.eventService.findById(eventId)]);
      if (!loggedUser) return AppResponse.unauthorized();
      if (!eventExist) return AppResponse.notFound("Event");

      // If the user is admin we must need ldoId otherwise get id from token
      let directorId = null;
      if (loggedUser.role === UserRole.director) {
        delete args.ldo;
        directorId = loggedUser._id;
      } else if (loggedUser.role === UserRole.admin) {
        if (!args.ldo)
          return AppResponse.handleError({
            success: false,
            message: 'You must select a director in order to update a event!',
          });
        directorId = args.ldo;
      }

      // Upload file to cloudinary
      const uploadPromises = [];
      for (let i = 0; i < sponsorsInput.length; i++) {
        if (typeof sponsorsInput[i] !== 'string') uploadPromises.push(this.cloudinaryService.uploadFiles(sponsorsInput[i]));
      }
      const cloudinaryUrls: string[] = await Promise.all(uploadPromises);

      const findLdo = await this.ldoService.findByDirectorId(directorId);

      // Arrange data and save to database
      const eventData: any = {
        ...args,
        ldo: findLdo._id,
        sponsors: cloudinaryUrls,
        divisions: eventExist.divisions
      };

      if (logo) {
        const logoUrl = await this.cloudinaryService.uploadFiles(logo);
        if (logoUrl) {
          eventData.logo = logoUrl;
        }
      }

      // Update divisions
      if (args.divisions && args.divisions !== "" && eventExist.divisions !== args.divisions) {
        // Check which item has been updated, Check previous division name
        const prevDivList = eventExist.divisions.split(',');
        const currDivList = args.divisions.split(',');

        const divisionPromises = [];


        // Check deleted item
        for (let i = 0; i < prevDivList.length; i++) {
          const findItemIndex = currDivList.findIndex((d) => d.includes("_") || d.trim().toLowerCase() === prevDivList[i].trim().toLowerCase());
          if (findItemIndex === -1) {
            // Create a regular expression for case-insensitive and trimmed search
            const regex = new RegExp(`^${prevDivList[i].trim()}$`, 'i');
            divisionPromises.push(this.teamService.update({ division: '' }, { division: { $regex: regex } }));
          }
        }

        // Check updated Item
        for (let i = 0; i < currDivList.length; i++) {
          if (currDivList[i].includes("_")) {
            const fl = currDivList[i].split("_");
            if (fl.length > 0 && fl[fl.length - 1] === "u") {
              let oe = fl[0], ne = fl[1];
              currDivList[i] = ne;

              // Create a regular expression for case-insensitive and trimmed search
              const regex = new RegExp(`^${oe.trim()}$`, 'i');
              divisionPromises.push(this.teamService.update({ division: ne }, { division: { $regex: regex } }));
            }
          }
        }

        await Promise.all(divisionPromises);
        eventData.divisions = currDivList.join(', ');
      }

      // Update Coach Password
      if (eventData.coachPassword) {
        const teamsOfEvent = await this.teamService.query({ event: eventId });
        const cap = [], coCap = [];
        for (const t of teamsOfEvent) {
          if (t.captain) cap.push(t.captain);
          if (t.cocaptain) coCap.push(t.cocaptain);
        }

        const userIds = [];
        const capUsers = await this.userService.query({ captainplayer: { $in: cap } });
        const capUserIds = capUsers.map((u) => u._id);
        userIds.push(...capUserIds)

        const coCapUsers = await this.userService.query({ cocaptainplayer: { $in: coCap } });
        const coCapUserIds = coCapUsers.map((u) => u._id);
        userIds.push(...coCapUserIds);

        if (userIds.length > 0) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(eventData.coachPassword, salt);

          await this.userService.updateMany({ _id: { $in: userIds } }, { password: hashedPassword });
        }


      }

      const updatedEvent = await this.eventService.update(eventData, eventId);
      // const updateLdo = await this.ldoService.update({ events: [updatedEvent._id] }, findLdo._id);

      return {
        data: updatedEvent,
        success: true,
        message: 'Event has been updated successfully.',
        code: HttpStatus.ACCEPTED,
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
    try {
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

      const playerIds = findEvent.players;

      // Event Clone
      const eventObj = { ...findEvent._doc, teams: [], sponsors: [], players: playerIds };
      eventObj.name = eventObj.name + ' Clone';
      delete eventObj._id;
      const clonedEvent = await this.eventService.create(eventObj);

      await this.playerService.updateMany({ _id: { $in: playerIds } }, { $push: { events: clonedEvent._id } });

      // teams
      const teamIds = findEvent.teams;
      const findTeams = await this.teamService.query({ _id: { $in: teamIds } });
      const teamObjList = [];
      for (const team of findTeams) {
        const teamObj = { ...team, name: team.name, active: true, event: clonedEvent._id };
        delete teamObj._id;
        teamObjList.push(teamObj)
      }
      const newTeams = await this.teamService.insertMany(teamObjList);
      const newTeamIds = newTeams.map((t) => t._id);

      // sponsors
      const sponsorIds = findEvent.sponsors;
      const sponsorsExist = await this.sponsorService.query({ _id: { $in: sponsorIds } });
      const sponsorObjList = [];
      for (const sponsor of sponsorsExist) {
        const sponsorObj = { ...sponsor, company: sponsor.company, logo: sponsor.logo, event: clonedEvent._id };
        delete sponsorObj._id;
        sponsorObjList.push(sponsorObj)
      }
      const newSponsors = await this.sponsorService.insertMany(sponsorObjList);
      const newSponsorIds = newSponsors.map((t) => t._id);

      await this.eventService.updateOne({ _id: clonedEvent._id }, { teams: newTeamIds, sponsors: newSponsorIds });

      return {
        data: clonedEvent,
        success: true,
        message: 'Event has been cloned successfully.',
        code: HttpStatus.CREATED,
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }

  }

  @Query((returns) => GetEventsResponse)
  async getEvents(
    @Context() context: any,
    @Args('directorId', { nullable: true }) directorId?: string
  ) {

    try {

      const secret = this.configService.get<string>('JWT_SECRET');
      const userId = tokenToUser(context, secret);

      // Get logged in user
      const loggedUser = userId ? await this.userService.findById(userId) : null;

      // Determine director ID based on user role
      let newDirectorId = null;
      if (loggedUser) {
        switch (loggedUser.role) {
          case UserRole.director:
            newDirectorId = loggedUser._id;
            break;
          case UserRole.admin:
            if (!directorId) {
              return AppResponse.handleError({
                success: false,
                message: 'You must select a director in order to update an event!',
              });
            }
            newDirectorId = directorId;
            break;
          default:
            break;
        }
      }

      // Filter events based on director ID
      const filter: FilterQuery<Event> = {};
      if (newDirectorId) {
        const ldoExist = await this.ldoService.findByDirectorId(newDirectorId);
        if (ldoExist) {
          filter.ldo = ldoExist._id;
        }
      }


      const events = await this.eventService.find(filter);
      return {
        code: HttpStatus.OK,
        success: true,
        data: events,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  @Query((returns) => GetEventResponse)
  async getEvent(@Args('eventId') eventId: string) {
    try {
      const findEvent = await this.eventService.findById(eventId);
      return {
        code: findEvent ? HttpStatus.OK : HttpStatus.NOT_FOUND,
        success: findEvent ? true : false,
        data: findEvent,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  
  /**
   * POPULATE
   * ===============================================================================================
   */

  @ResolveField()
  async ldo(@Parent() event: Event) {
    return this.ldoService.findByDirectorId(event.ldo.toString());
  }

  @ResolveField()
  async teams(@Parent() event: Event) {
    const teamList = await this.teamService.query({ _id: { $in: event.teams } });
    return teamList;
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
