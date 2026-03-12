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
import { randomString, tokenToUser } from 'src/utils/helper';
import { CreateOrUpdateEventResponse, GetEventResponse } from './event.response';
import { CreateEventBody, UpdateEventBody, UpdateEventInput } from './event.input';
import { IEventMutations } from '../resolvers/event.types';
import { Team } from 'src/team/team.schema';
import { EPlayerStatus, Player } from 'src/player/player.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { ArchiveEventService, ArchiveGroupService, ArchiveMatchService, ArchiveNetService, ArchivePlayerRankingItemService, ArchivePlayerRankingService, ArchivePlayerStatsService, ArchiveRoomService, ArchiveRoundService, ArchiveServerReceiverOnNetService, ArchiveServerReceiverSinglePlayService, ArchiveSponsorService, ArchiveTeamService, ArchiveTemplateService } from 'src/archive/archive.service';
import { TemplateService } from 'src/template/template.service';
import { ProStats } from 'src/player-stats/player-stats.schema';
import { RoomService } from 'src/room/room.service';
import { ServerReceiverOnNetService } from 'src/server-receiver-on-net/server-receiver-on-net.service';
import { PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';


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
    private roomService: RoomService,
    private roundService: RoundService,
    private netService: NetService,
    private groupService: GroupService,
    private playerRankingService: PlayerRankingService,
    private sponsorService: SponsorService,
    private templateService: TemplateService,
    private serverReceiverOnNetService: ServerReceiverOnNetService,

    // Archive
    private archiveTeamService: ArchiveTeamService,
    private archiveMatchService: ArchiveMatchService,
    private archiveGroupService: ArchiveGroupService,
    private archiveSponsorService: ArchiveSponsorService,
    private archiveTemplateService: ArchiveTemplateService,
    private archivePlayerStatsService: ArchivePlayerStatsService,
    private archiveNetService: ArchiveNetService,
    private archivePlayerRankingService: ArchivePlayerRankingService,
    private archivePlayerRankingItemService: ArchivePlayerRankingItemService,
    private archiveRoomService: ArchiveRoomService,
    private archiveRoundService: ArchiveRoundService,
    private archiveServerReceiverOnNetService: ArchiveServerReceiverOnNetService,
    private archiveServerReceiverSinglePlayService: ArchiveServerReceiverSinglePlayService,
    private archiveEventService: ArchiveEventService,
  ) { }

  async createEvent({
    sponsorsInput,
    input,
    context,
    multiplayerInput,
    weightInput,
    logo,
  }: CreateEventBody): Promise<CreateOrUpdateEventResponse> {
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
        // Temp
        // uploadPromises.push(this.cloudinaryService.uploadSponsors(sponsorsInput[i].logo, sponsorsInput[i].company));
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
        templates: []
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
    logo,
  }: UpdateEventBody): Promise<CreateOrUpdateEventResponse> {
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
        directorId = eventExist.ldo;
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
        const logoUrl = await this.cloudinaryService.uploadFiles(logo as any);
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

  async cloneEvent(
    eventId: string,
    updateInput: UpdateEventInput
  ): Promise<CreateOrUpdateEventResponse> {
    try {
      const event = await this.eventService.findOne({ _id: eventId });
      if (!event) return AppResponse.notFound("Event not found!");

      const NAME_KEY = randomString(16);

      const [players, teams] = await Promise.all([
        this.playerService.find({ events: eventId }),
        this.teamService.find({ event: eventId }),
      ]);

      // -------------------------
      // Create new event
      // -------------------------
      const {
        _id,
        multiplayer,
        weight,
        ...eventData
      } = event as Event;

      const [multiplayerStats, weightStats] = await Promise.all([
        this.playerStatsService.proStatFindOne({ _id: String(multiplayer) }),
        this.playerStatsService.proStatFindOne({ _id: String(weight) }),
      ]);

      if (!multiplayerStats || !weightStats) {
        return AppResponse.notFound('PlayerStats');
      }

      

      const newEvent = await this.eventService.create({
        ...eventData,
        ...updateInput,
        players: [],
        teams: [],
        matches: [],
        groups: [],
        location: updateInput?.location || "USA",
      });

      const { _id: _mId, ...multiplayerPayload } = multiplayerStats;
      const { _id: _wId, ...weightPayload } = weightStats;

      const [newMultiplayer, newWeight] = await Promise.all([
        this.playerStatsService.proStatCreate({...multiplayerPayload, event: newEvent._id}),
        this.playerStatsService.proStatCreate({...weightPayload, event: newEvent._id}),
      ]);

      const updateEvent: Partial<Event> = {};
      updateEvent.multiplayer = newMultiplayer._id;
      updateEvent.weight = newWeight._id;

      // -------------------------
      // Player maps
      // -------------------------
      const playerIds = players.map((p) => String(p._id));
      const playerMap = new Map(players.map((p) => [String(p._id), p]));

      updateEvent.players = playerIds;

      // -------------------------
      // Prepare teams
      // -------------------------
      const teamMap = new Map<string, Team>();
      const organizedTeams: Team[] = teams.map((team) => {
        const uniqueName = `${team.name}_${NAME_KEY}`;
        teamMap.set(uniqueName, team);

        const { _id, createdAt, updatedAt, ...clean } = team as any;

        return {
          ...clean,
          event: newEvent._id,
          rankLock: false,
          sendCredentials: false,
          matches: [],
          players: [],
          moved: [],
          nets: [],
          group: null,
          playerRankings: [],
          captain: null,
          cocaptain: null,
        };
      });

      const createdTeams = await this.teamService.insertMany(organizedTeams);

      // -------------------------
      // Group players by team
      // -------------------------
      const playersByTeam = new Map<string, Player[]>();

      for (const player of players) {
        for (const teamId of player.teams || []) {
          const key = String(teamId);
          if (!playersByTeam.has(key)) playersByTeam.set(key, []);
          playersByTeam.get(key)!.push(player);
        }
      }

      const updatePromises: Promise<any>[] = [];
      const newTeamIds: string[] = [];

      // -------------------------
      // Process created teams
      // -------------------------
      for (const team of createdTeams) {
        const uniqueName = `${team.name}_${NAME_KEY}`;
        const prevTeam = teamMap.get(uniqueName);
        if (!prevTeam) continue;

        newTeamIds.push(String(team._id));

        const teamPlayers = playersByTeam.get(String(prevTeam._id)) || [];

        if (teamPlayers.length) {
          updatePromises.push(
            this.playerService.updateMany(
              { _id: teamPlayers.map((p) => p._id) },
              { $addToSet: { teams: team._id } }
            )
          );
        }

        const rankings: PlayerRankingItem[] = [];

        let rank = 1;

        for (const player of teamPlayers) {
          if (player.status !== EPlayerStatus.ACTIVE) continue;

          rankings.push({
            player: String(player._id),
            rank: rank++,
          } as PlayerRankingItem);
        }

        const newRanking = await this.playerRankingService.create({
          rankings,
          rankLock: false,
          team,
        });

        updatePromises.push(
          this.teamService.updateOne(
            { _id: team._id },
            {
              players: teamPlayers.map((p) => String(p._id)),
              playerRankings: [String(newRanking._id)],
            }
          )
        );
      }

      updateEvent.teams = newTeamIds;

      // -------------------------
      // Update players
      // -------------------------
      updatePromises.push(
        this.playerService.updateMany(
          { _id: { $in: playerIds } },
          { $addToSet: { events: newEvent._id } }
        )
      );

      // -------------------------
      // Update event
      // -------------------------
      updatePromises.push(
        this.eventService.updateOne({ _id: newEvent._id }, updateEvent)
      );

      await Promise.all(updatePromises);

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        data: newEvent,
        message: "Event has been cloned successfully",
      };
    } catch (error) {
      return AppResponse.handleError(error);
    }
  }

  async deleteEvent(context: any, eventId: string): Promise<GetEventResponse> {
    try {
      const promisesToDelete: Promise<any>[] = [];
      const promisesToArchive: Promise<any>[] = [];
      const promisesToUpdate: Promise<any>[] = [];
      const eventExist = await this.eventService.findById(eventId);
      if (!eventExist) return AppResponse.notFound("Event");

      // Use archive instead of permanently delete
      // team, match, group, sponsors, player stats, templates -> related fileds from both side
      const [
        teams,
        matches,
        groups,
        sponsors,
        templates,
        multiplayers_weights,
        nets,
      ] = await Promise.all([
        this.teamService.find({ event: eventId }),
        this.matchService.find({ event: eventId }),
        this.groupService.find({ event: eventId }),
        this.sponsorService.find({ event: eventId }),
        this.templateService.find({ event: eventId }),
        this.playerStatsService.find({ event: eventId }),
        this.netService.find({ event: eventId }),
      ]);


      if (teams.length > 0) {
        promisesToArchive.push(this.archiveTeamService.createMany(teams))
        promisesToDelete.push(this.teamService.deleteMany({ event: eventId }));
      }


      if (matches.length > 0) {
        promisesToArchive.push(this.archiveMatchService.createMany(matches))
        promisesToDelete.push(this.matchService.deleteMany({ event: eventId }));
      }

      if (groups.length > 0) {
        promisesToArchive.push(this.archiveGroupService.createMany(groups))
        promisesToDelete.push(this.groupService.deleteMany({ event: eventId }));
      }

      if (sponsors.length > 0) {
        promisesToArchive.push(this.archiveSponsorService.createMany(sponsors))
        promisesToDelete.push(this.sponsorService.deleteMany({ event: eventId }));
      }

      if (templates.length > 0) {
        promisesToArchive.push(this.archiveTemplateService.createMany(templates))
        promisesToDelete.push(this.templateService.deleteMany({ event: eventId }));
      }

      //  multiplayer, weight,  -> Both of them are pro stats
      if (multiplayers_weights.length > 0) {
        promisesToArchive.push(this.archivePlayerStatsService.createMany(multiplayers_weights));
        promisesToDelete.push(this.playerStatsService.deleteMany({ event: eventId }));
      }


      // Update ldo, player 
      promisesToUpdate.push(this.ldoService.updateOne({ events: eventId }, { $addToSet: { archivedEvents: eventId } }));
      promisesToUpdate.push(this.playerService.updateMany({ events: eventId }, { $addToSet: { archivedEvents: eventId } }));

      // net, player ranking, room, round, server receiver on net -> non related

      if (nets.length > 0) {
        promisesToArchive.push(this.archiveNetService.createMany(nets));
        promisesToDelete.push(this.netService.deleteMany({ event: eventId }));
      }


      const playerRankings = await this.playerRankingService.find({ event: eventId });
      if (playerRankings.length > 0) {
        promisesToArchive.push(this.archivePlayerRankingService.createMany(playerRankings));
        promisesToDelete.push(this.playerRankingService.deleteMany({ event: eventId }));

        const rankingIds = playerRankings.map((pr) => String(pr._id));

        const playerRankingItems = await this.playerRankingService.findItems({ playerRanking: { $in: rankingIds }, });
        if (playerRankingItems.length > 0) {
          promisesToArchive.push(
            this.archivePlayerRankingItemService.createMany(playerRankingItems)
          );

          promisesToDelete.push(
            this.playerRankingService.deleteManyItem({
              _id: { $in: playerRankingItems.map((pri) => String(pri._id)) },
            })
          );
        }
      }


      const [rooms, rounds, serverReceiverOnNets, serverReceiverOnNetPlays] = await Promise.all([
        this.roomService.find({ match: { $in: [...new Set(matches.map((m) => String(m._id)))] } }),
        this.roundService.find({ match: { $in: [...new Set(matches.map((m) => String(m._id)))] } }),
        this.serverReceiverOnNetService.find({ event: eventId }),
        this.serverReceiverOnNetService.findSinglePlay({ event: eventId }),
      ]);


      if (rooms.length > 0) {
        promisesToArchive.push(this.archiveRoomService.createMany(rooms.map((r) => ({ ...r, teamA: r?.teamA || "", teamB: r?.teamB || "" }))));
        promisesToArchive.push(this.roomService.deleteMany({ match: { $in: [...new Set(matches.map((m) => String(m._id)))] } }));
      }

      if (rounds.length > 0) {
        promisesToArchive.push(this.archiveRoundService.createMany(rounds));
        promisesToArchive.push(this.roundService.deleteMany({ match: { $in: [...new Set(matches.map((m) => String(m._id)))] } }));
      }

      if (serverReceiverOnNets.length > 0) {
        promisesToArchive.push(this.archiveServerReceiverOnNetService.createMany(serverReceiverOnNets));
        promisesToDelete.push(this.serverReceiverOnNetService.deleteMany({ event: eventId }))
      }


      if (serverReceiverOnNetPlays.length > 0) {
        promisesToArchive.push(this.archiveServerReceiverSinglePlayService.createMany(serverReceiverOnNetPlays));
        promisesToDelete.push(this.archiveServerReceiverSinglePlayService.deleteMany({ event: eventId }))
      }



      promisesToArchive.push(this.archiveEventService.create({ ...eventExist }));
      promisesToDelete.push(this.eventService.delete({ _id: eventId }));


      await Promise.all(promisesToArchive);
      await Promise.all(promisesToDelete);
      await Promise.all(promisesToUpdate);


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

  async updateEventCache(eventId: string) {
    try {
      const event = await this.eventService.findOne({ _id: eventId });
      if (!event) throw new Error('No event found');

      const matches = await this.matchService.find({ event: event._id });
      if (matches.length === 0) throw new Error('No match created');

      for (const match of matches) {
        if (match.completed) {
          // this.scoreKeeperHelper.loadNetAction(body.net, body.room)
          // const nets = await this.scoreKeeperHelper.loadNetAction(body.net, body.room);
          // server receiver
          // Player stats
          // play stats
        }
      }
    } catch (err) {
      console.error(err);
      return AppResponse.handleError(err);
    }
  }
}
