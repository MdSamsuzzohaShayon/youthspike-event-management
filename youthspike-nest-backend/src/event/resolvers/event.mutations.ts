import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Event } from '../event.schema';
import { EventService } from '../event.service';
import { TeamService } from 'src/team/team.service';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { UserService } from 'src/user/user.service';
import { LdoService } from 'src/ldo/ldo.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { SponsorService } from 'src/sponsor/sponsor.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { GroupService } from 'src/group/group.service';
import { PlayerStatsService } from 'src/player-stats/player-stats.service';
import { AppResponse } from 'src/shared/response';
import { UserRole } from 'src/user/user.schema';
import { tokenToUser } from 'src/util/helper';
import { CreateOrUpdateEventResponse, GetEventResponse } from './event.response';
import {
  CreateEventInput,
  EventSponsorInput,
  EventSponsorStringInput,
  ProStatsInput,
  UpdateEventInput,
  UpdateProStatsInput,
} from './event.input';
import { IEventMutations } from '../resolvers/event.types';

@Injectable()
export class EventMutations implements IEventMutations {
  constructor(
    private configService: ConfigService,
    private eventService: EventService,
    private teamService: TeamService,
    private ldoService: LdoService,
    private cloudinaryService: CloudinaryService,
    private playerService: PlayerService,
    private playerStatsService: PlayerStatsService,
    private matchService: MatchService,
    private userService: UserService,
    private roundService: RoundService,
    private netService: NetService,
    private groupService: GroupService,
    private sponsorService: SponsorService,
  ) {}

  async createEvent({
    sponsorsInput,
    input,
    context,
    multiplayerInput,
    weightInput,
    statsInput,
    logo,
  }: any): Promise<CreateOrUpdateEventResponse> {
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
      const userPayload = tokenToUser(context, secret);

      // Get user
      const loggedUser = await this.userService.findById(userPayload._id);
      if (!loggedUser) return AppResponse.unauthorized();

      // If the user is admin we must need ldoId otherwise get id from token
      let directorId = null;
      if (loggedUser.role === UserRole.director) {
        directorId = loggedUser._id;
      } else if (loggedUser.role === UserRole.admin) {
        if (!input.ldo) {
          return AppResponse.handleError({
            success: false,
            message: 'You must provide a LDO id in order to create an Event!',
          });
        }
        directorId = input.ldo;
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
      const eventData: Event = {
        ...input,
        ldo: findLdo._id,
        logo: logoUrl,
        sendCredentials: false,
        sponsors: sponsorsIds,
        players: [],
        teams: [],
        matches: [],
        groups: [],
      };

      const savedEvent = await this.eventService.create(eventData);

      const eventUpdateObj: Partial<Event> = {};
      if (multiplayerInput) {
        const multiplayer = await this.playerStatsService.proStatCreate({ ...multiplayerInput, event: savedEvent._id });
        eventUpdateObj.multiplayer = multiplayer._id;
      }
      if (weightInput) {
        const weight = await this.playerStatsService.proStatCreate({ ...weightInput, event: savedEvent._id });
        eventUpdateObj.weight = weight._id;
      }
      if (statsInput) {
        const stats = await this.playerStatsService.proStatCreate({ ...statsInput, event: savedEvent._id });
        eventUpdateObj.stats = stats._id;
      }

      await Promise.all([
        this.ldoService.update({ events: [savedEvent._id.toString()] }, findLdo._id.toString()),
        this.sponsorService.updateMany({ _id: { $in: sponsorsIds } }, { event: savedEvent._id }),
        this.eventService.updateOne({ _id: savedEvent._id }, eventUpdateObj),
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

  async updateEvent({
    sponsorsInput,
    updateInput,
    eventId,
    context,
    sponsorsStringInput,
    multiplayerInput,
    weightInput,
    statsInput,
    logo,
  }: any): Promise<CreateOrUpdateEventResponse> {
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
      const userPayload = tokenToUser(context, secret);

      // ===== Get user =====
      const [loggedUser, eventExist] = await Promise.all([
        this.userService.findById(userPayload._id),
        this.eventService.findById(eventId),
      ]);
      if (!loggedUser) return AppResponse.unauthorized();
      if (!eventExist) return AppResponse.notFound('Event');

      // If the user is admin we must need ldoId otherwise get id from token
      let directorId = null;
      if (loggedUser.role === UserRole.director) {
        delete updateInput.ldo;
        directorId = loggedUser._id;
      } else if (loggedUser.role === UserRole.admin) {
        if (!updateInput.ldo)
          return AppResponse.handleError({
            success: false,
            message: 'You must select a director in order to update a event!',
          });
        directorId = updateInput.ldo;
      }

      const findLdo = await this.ldoService.findByDirectorId(directorId);

      // ===== Arrange data and save to database =====
      const eventData: any = {
        ...updateInput,
        ldo: findLdo._id,
        // sponsors: cloudinaryUrls,
        divisions: eventExist.divisions,
      };

      // ===== Upload Sponsors =====
      if ((sponsorsInput && sponsorsInput.length > 0) || (sponsorsStringInput && sponsorsStringInput.length > 0)) {
        const prevSponsors = eventExist.sponsors;
        const newSponsorIds = [];

        const uploadPromises = [];
        // for (let i = 0; i < sponsorsInput.length; i++) {
        //   uploadPromises.push(this.cloudinaryService.uploadSponsors(sponsorsInput[i].logo, sponsorsInput[i].company));
        // }
        const sponsorItemList = await Promise.all(uploadPromises);
        if (sponsorItemList.length > 0) {
          const organizeSponsors = sponsorItemList.map((s) => ({ company: s.company, logo: s.logo, event: eventId }));
          const sponsorList = await this.sponsorService.insertMany(organizeSponsors);
          newSponsorIds.push(...sponsorList.map((doc) => doc._id.toString()));
        }

        // Find new sponsors
        if (sponsorsStringInput.length > 0) {
          const prevSponsorList = await this.sponsorService.find({ event: eventId });
          if (prevSponsorList && prevSponsorList.length > 0) {
            for (const ps of prevSponsorList) {
              const matchedSponsor = sponsorsStringInput.find(
                (ssi) => ssi.company === ps.company && ssi.logo === ps.logo,
              );
              if (matchedSponsor) newSponsorIds.push(ps._id.toString());
            }
          }
        }

        eventData.sponsors = newSponsorIds;
        const deleteSponsors = [];
        for (const ps of prevSponsors) {
          if (!newSponsorIds.includes(ps.toString())) deleteSponsors.push(ps);
        }
        if (deleteSponsors && deleteSponsors.length > 0)
          await this.sponsorService.deleteMany({ _id: { $in: deleteSponsors } });
      }

      // ===== Update logo =====
      if (logo) {
        const logoUrl = await this.cloudinaryService.uploadFiles(logo);
        if (logoUrl) {
          eventData.logo = logoUrl;
        }
      }

      // ===== Update divisions =====
      if (updateInput.divisions && updateInput.divisions !== '' && eventExist.divisions !== updateInput.divisions) {
        // Check which item has been updated, Check previous division name
        const prevDivList = eventExist.divisions.split(',');
        const currDivList = updateInput.divisions.split(',');

        const divisionPromises = [];

        // Check deleted item
        for (let i = 0; i < prevDivList.length; i++) {
          const findItemIndex = currDivList.findIndex(
            (d) => d.includes('_') || d.trim().toLowerCase() === prevDivList[i].trim().toLowerCase(),
          );
          if (findItemIndex === -1) {
            // Create a regular expression for case-insensitive and trimmed search
            const regex = new RegExp(`^${prevDivList[i].trim()}$`, 'i');
            divisionPromises.push(this.teamService.updateOne({ division: { $regex: regex } }, { division: '' }));
          }
        }

        // Check updated Item
        for (let i = 0; i < currDivList.length; i++) {
          if (currDivList[i].includes('_')) {
            const fl = currDivList[i].split('_');
            if (fl.length > 0 && fl[fl.length - 1] === 'u') {
              const oe = fl[0],
                ne = fl[1];
              currDivList[i] = ne;

              // Create a regular expression for case-insensitive and trimmed search
              const regex = new RegExp(`^${oe.trim()}$`, 'i');
              divisionPromises.push(this.teamService.updateOne({ division: { $regex: regex } }, { division: ne }));
            }
          }
        }

        await Promise.all(divisionPromises);
        eventData.divisions = currDivList.join(', ');
      }

      // ===== Update Coach Password =====
      if (eventData.coachPassword) {
        const teamsOfEvent = await this.teamService.find({ event: eventId });
        const cap = [],
          coCap = [];
        for (const t of teamsOfEvent) {
          if (t.captain) cap.push(t.captain);
          if (t.cocaptain) coCap.push(t.cocaptain);
        }

        const userIds = [];
        const capUsers = await this.userService.find({ captainplayer: { $in: cap } });
        const capUserIds = capUsers.map((u) => u._id);
        userIds.push(...capUserIds);

        const coCapUsers = await this.userService.find({ cocaptainplayer: { $in: coCap } });
        const coCapUserIds = coCapUsers.map((u) => u._id);
        userIds.push(...coCapUserIds);

        if (userIds && userIds.length > 0) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(eventData.coachPassword, salt);

          await this.userService.updateMany({ _id: { $in: userIds } }, { password: hashedPassword });
        }
      }

      // ===== Update Stats =====
      const statsUpdatePromises = [];
      if (multiplayerInput && Object.entries(multiplayerInput).length > 0) {
        statsUpdatePromises.push(
          this.playerStatsService.proStatUpdateOne({ _id: eventExist.multiplayer }, multiplayerInput),
        );
      }
      if (weightInput && Object.entries(weightInput).length > 0) {
        statsUpdatePromises.push(this.playerStatsService.proStatUpdateOne({ _id: eventExist.weight }, weightInput));
      }
      if (statsInput && Object.entries(statsInput).length > 0) {
        statsUpdatePromises.push(this.playerStatsService.proStatUpdateOne({ _id: eventExist.stats }, statsInput));
      }

      await Promise.all([...statsUpdatePromises, this.eventService.updateOne({ _id: eventId }, eventData)]);
      const updatedEvent = await this.eventService.findById(eventId);

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

  async cloneEvent(eventId: string, context: any): Promise<CreateOrUpdateEventResponse> {
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
      const userPayload = tokenToUser(context, secret);
      const loggedUser = await this.userService.findById(userPayload._id);
      if (!loggedUser) return AppResponse.unauthorized();

      // Role Check
      let findEvent = null;
      if (loggedUser.role === UserRole.director) {
        findEvent = await this.eventService.findOne({ $and: [{ _id: eventId }, { directorId: userPayload._id }] });
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
      const findTeams = await this.teamService.find({ _id: { $in: teamIds } });
      const teamObjList = [];
      for (const team of findTeams) {
        const teamObj = { ...team, name: team.name, active: true, event: clonedEvent._id };
        delete teamObj._id;
        teamObjList.push(teamObj);
      }
      const newTeams = await this.teamService.insertMany(teamObjList);
      const newTeamIds = newTeams.map((t) => t._id);

      // sponsors
      const sponsorIds = findEvent.sponsors;
      const sponsorsExist = await this.sponsorService.find({ _id: { $in: sponsorIds } });
      const sponsorObjList = [];
      for (const sponsor of sponsorsExist) {
        const sponsorObj = { ...sponsor, company: sponsor.company, logo: sponsor.logo, event: clonedEvent._id };
        delete sponsorObj._id;
        sponsorObjList.push(sponsorObj);
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

  async deleteEvent(context: any, eventId: string): Promise<GetEventResponse> {
    /**
     * Delete all events assosiated with it
     * Delete the user that is assosiated with it
     * Delete all teams, players, rounds, nets assosiated with it
     * Delete captain and players assosiated with it
     */
    try {
      const promisesToDelete = [];
      const eventExist = await this.eventService.findById(eventId);
      if (!eventExist)
        return AppResponse.handleError({ code: HttpStatus.NOT_FOUND, success: false, message: 'Event is not found' });

      if (eventExist.teams && eventExist.teams.length > 0) {
        const teamIds = eventExist.teams.map((team) => team.toString());
        promisesToDelete.push(this.teamService.delete({ _id: { $in: teamIds } }));

        // captains
        const teams = await this.teamService.find({ _id: { $in: teamIds } });
        if (teams && teams.length > 0) {
          const captainPlayerIds = teams.filter((team) => team.captain).map((team) => team.captain.toString());
          promisesToDelete.push(this.userService.delete({ captainplayer: { $in: captainPlayerIds } }));
        }
      }
      if (eventExist.players && eventExist.players.length > 0) {
        const playerIds = eventExist.players.map((player) => player.toString());
        promisesToDelete.push(this.playerService.delete({ _id: { $in: playerIds } }));
      }
      if (eventExist.matches && eventExist.matches.length > 0) {
        const matchIds = eventExist.matches.map((match) => match.toString());
        promisesToDelete.push(this.matchService.delete({ _id: { $in: matchIds } }));

        // Rounds, nets
        const matches = await this.matchService.find({ _id: { $in: matchIds } });
        if (matches && matches.length > 0) {
          for (const match of matches) {
            const roundIds = match.rounds.map((r) => r.toString());
            promisesToDelete.push(this.roundService.deleteMany({ _id: { $in: roundIds } }));

            const netIds = match.nets.map((r) => r.toString());
            promisesToDelete.push(this.netService.delete({ _id: { $in: netIds } }));
          }
        }
      }

      promisesToDelete.push(this.eventService.delete({ _id: eventId }));

      await Promise.all(promisesToDelete);
      return {
        code: HttpStatus.NO_CONTENT,
        success: true,
        message: 'Delete the LDO successfully!',
        data: null,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
