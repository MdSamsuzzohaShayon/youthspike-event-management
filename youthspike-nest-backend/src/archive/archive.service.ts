import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  ArchiveEvent,
  ArchiveGroup,
  ArchiveLDO,
  ArchiveMatch,
  ArchiveNet,
  ArchivePlayer,
  ArchivePlayerRanking,
  ArchivePlayerRankingItem,
  ArchivePlayerStats,
  ArchiveRoom,
  ArchiveRound,
  ArchiveServerReceiverOnNet,
  ArchiveServerReceiverSinglePlay,
  ArchiveSponsor,
  ArchiveTeam,
  ArchiveTemplate,
  ArchiveUser,
} from './archive.schema';
import { Document, Model, QueryFilter, Types, UpdateQuery } from 'mongoose';
import { Event } from 'src/event/event.schema';
import { Group } from 'src/group/group.schema';
import { LDO } from 'src/ldo/ldo.schema';
import { Match } from 'src/match/match.schema';
import { Net } from 'src/net/net.schema';
import { Player } from 'src/player/player.schema';
import { PlayerRanking, PlayerRankingItem } from 'src/player-ranking/player-ranking.schema';
import { PlayerStats } from 'src/player-stats/player-stats.schema';
import { Round } from 'src/round/round.schema';
import { ServerReceiverOnNet, ServerReceiverSinglePlay } from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { Sponsor } from 'src/sponsor/sponsor.schema';
import { Team } from 'src/team/team.schema';
import { Template } from 'src/template/template.schema';
import { User } from 'src/user/user.schema';
import { Room } from 'src/room/room.schema';

// Base Service Interface
interface IBaseService<T> {
  findById(id: string): Promise<T | null>;
  findOne(filter: QueryFilter<T>): Promise<T | null>;
  find(filter: QueryFilter<T>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;
  updateById(id: string, updateData: UpdateQuery<T>): Promise<T | null>;
  updateOne(filter: QueryFilter<T>, updateData: UpdateQuery<T>): Promise<any>;
  updateMany(filter: QueryFilter<T>, updateData: UpdateQuery<T>): Promise<any>;
  deleteById(id: string): Promise<any>;
  delete(filter: QueryFilter<T>): Promise<any>;
  archive(id: string): Promise<T | null>;
  restore(id: string): Promise<T | null>;
  count(filter: QueryFilter<T>): Promise<number>;
  exists(filter: QueryFilter<T>): Promise<boolean>;
}

interface IBaseDocument {
  _id: Types.ObjectId;
  __v?: number;
}

type LeanDocument<T> = T & IBaseDocument;

// Base Service Implementation
@Injectable()
export class BaseService<T> implements IBaseService<T> {
  constructor(
    protected readonly model: Model<T>,
    protected readonly archivedModel?: Model<any>,
  ) { }

  async findById(id: string): Promise<(T & { _id: Types.ObjectId }) | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.model.findById(id).lean();
    return doc as (T & { _id: Types.ObjectId }) | null;
  }

  async findOne(filter: QueryFilter<T>): Promise<(T & { _id: Types.ObjectId }) | null> {
    const doc = await this.model.findOne(filter).lean();
    return doc as (T & { _id: Types.ObjectId }) | null;
  }

  async find(filter: QueryFilter<T>): Promise<T[]> {
    return this.model.find(filter).lean();
  }

  async create(data: T): Promise<T & { _id: Types.ObjectId }> {
    const created = new this.model(data);
    const saved = await created.save();
    return saved.toObject() as T & { _id: Types.ObjectId };
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    if (!data?.length) {
      return [];
    }

    try {
      // Pre-allocate array for better memory efficiency
      const serializedData = new Array(data.length);

      // Single loop with minimal object creation
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const itemWithId = item as Partial<T> & { _id?: Types.ObjectId };

        if (itemWithId._id) {
          // Create new object only when needed
          const { _id, ...rest } = itemWithId;
          serializedData[i] = { ...rest, originalId: _id.toString() } as T;
        } else {
          serializedData[i] = item as T;
        }
      }

      const created = await this.model.insertMany(serializedData) as unknown as (Document & T)[];

      // Reuse array for results
      const results = new Array(created.length);
      for (let i = 0; i < created.length; i++) {
        const { __v, ...cleanDoc } = created[i].toObject() as any;
        results[i] = cleanDoc as T;
      }

      return results;

    } catch (error) {
      console.error('Error in createMany:', error);
      throw error;
    }
  }

  async updateById(id: string, updateData: UpdateQuery<T>): Promise<(T & { _id: Types.ObjectId }) | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.model.findByIdAndUpdate(id, updateData, { new: true }).lean();
    return doc as (T & { _id: Types.ObjectId }) | null;
  }


  async updateOne(filter: QueryFilter<T>, updateData: UpdateQuery<T>): Promise<any> {
    return this.model.updateOne(filter, updateData);
  }

  async updateMany(filter: QueryFilter<T>, updateData: UpdateQuery<T>): Promise<any> {
    return this.model.updateMany(filter, updateData);
  }

  async deleteById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.model.deleteOne({ _id: id });
  }

  async delete(filter: QueryFilter<T>): Promise<any> {
    return this.model.deleteMany(filter);
  }
  async deleteMany(filter: QueryFilter<T>): Promise<any> {
    return this.model.deleteMany(filter);
  }

  async archive(id: string): Promise<T | null> {
    // Validate inputs
    if (!Types.ObjectId.isValid(id)) {
      console.warn(`Invalid ObjectId: ${id}`);
      return null;
    }

    if (!this.archivedModel) {
      console.warn('Archive model not available');
      return null;
    }

    try {
      // Fetch the document with explicit typing
      const document = await this.model
        .findById(id)
        .lean()
        .exec() as LeanDocument<T> | null;

      if (!document) {
        console.warn(`Document with id ${id} not found`);
        return null;
      }

      // Create a clean copy for archiving
      const archiveData: Record<string, any> = {
        ...document,
        originalId: document._id.toString(),
        _id: new Types.ObjectId(),
        archivedAt: new Date(),
      };

      // Remove Mongoose-specific fields
      delete archiveData.__v;
      delete archiveData.id; // Remove if using virtual id

      // Create archive document
      await this.archivedModel.create(archiveData);

      // Delete original document
      const deleteResult = await this.model.deleteOne({ _id: id });

      if (deleteResult.deletedCount === 0) {
        console.warn(`Failed to delete original document ${id}`);
        // Optionally rollback archive creation here
        return null;
      }

      // Return the original document (without archive modifications)
      return document as unknown as T;

    } catch (error) {
      console.error(`Error archiving document ${id}:`, error);

      // Attempt to clean up if archive was created but original deletion failed
      // This is a simplified example - you might want more sophisticated error handling

      return null;
    }
  }

  async restore(id: string): Promise<T | null> {
    if (!Types.ObjectId.isValid(id) || !this.archivedModel) {
      return null;
    }

    const archived = await this.archivedModel.findById(id).lean();
    if (!archived) {
      return null;
    }

    // Restore original document
    const restoreData = { ...archived };
    delete restoreData._id;
    delete restoreData.originalId;
    delete restoreData.archivedAt;
    delete restoreData.__v;

    const restored = await this.model.create({
      ...restoreData,
      _id: new Types.ObjectId(archived.originalId),
    });

    // Delete archive
    await this.archivedModel.deleteOne({ _id: id });

    return restored as T;
  }

  async count(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async exists(filter: QueryFilter<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1);
    return count > 0;
  }
}

// Event Service
@Injectable()
export class ArchiveEventService extends BaseService<Event> {
  constructor(
    @InjectModel(Event.name) eventModel: Model<Event>,
    @InjectModel(ArchiveEvent.name) archivedEventModel: Model<ArchiveEvent>,
  ) {
    super(eventModel, archivedEventModel);
  }

  async findByName(name: string): Promise<Event | null> {
    if (!name) return null;
    return this.model.findOne({ name }).lean();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return this.model.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();
  }
}

// Group Service
@Injectable()
export class ArchiveGroupService extends BaseService<Group> {
  constructor(
    @InjectModel(Group.name) groupModel: Model<Group>,
    @InjectModel(ArchiveGroup.name) archivedGroupModel: Model<ArchiveGroup>,
  ) {
    super(groupModel, archivedGroupModel);
  }

  async findByEventId(eventId: string): Promise<Group[]> {
    return this.model.find({ eventId }).lean();
  }
}

// LDO Service
@Injectable()
export class ArchiveLDOService extends BaseService<LDO> {
  constructor(
    @InjectModel(LDO.name) ldoModel: Model<LDO>,
    @InjectModel(ArchiveLDO.name) archivedLDOModel: Model<ArchiveLDO>,
  ) {
    super(ldoModel, archivedLDOModel);
  }
}

// Match Service
@Injectable()
export class ArchiveMatchService extends BaseService<Match> {
  constructor(
    @InjectModel(Match.name) matchModel: Model<Match>,
    @InjectModel(ArchiveMatch.name) archivedMatchModel: Model<ArchiveMatch>,
  ) {
    super(matchModel, archivedMatchModel);
  }
}

// Net Service
@Injectable()
export class ArchiveNetService extends BaseService<Net> {
  constructor(
    @InjectModel(Net.name) netModel: Model<Net>,
    @InjectModel(ArchiveNet.name) archivedNetModel: Model<ArchiveNet>,
  ) {
    super(netModel, archivedNetModel);
  }
}

// Player Service
@Injectable()
export class ArchivePlayerService extends BaseService<Player> {
  constructor(
    @InjectModel(Player.name) playerModel: Model<Player>,
    @InjectModel(ArchivePlayer.name) archivedPlayerModel: Model<ArchivePlayer>,
  ) {
    super(playerModel, archivedPlayerModel);
  }
}

// PlayerRanking Service
@Injectable()
export class ArchivePlayerRankingService extends BaseService<PlayerRanking> {
  constructor(
    @InjectModel(PlayerRanking.name) playerRankingModel: Model<PlayerRanking>,
    @InjectModel(ArchivePlayerRanking.name) archivedPlayerRankingModel: Model<ArchivePlayerRanking>,
  ) {
    super(playerRankingModel, archivedPlayerRankingModel);
  }
}

@Injectable()
export class ArchivePlayerRankingItemService extends BaseService<PlayerRankingItem> {
  constructor(
    @InjectModel(PlayerRankingItem.name) playerRankingModel: Model<PlayerRankingItem>,
    @InjectModel(ArchivePlayerRankingItem.name) archivedPlayerRankingItemModel: Model<ArchivePlayerRankingItem>,
  ) {
    super(playerRankingModel, archivedPlayerRankingItemModel);
  }
}

// PlayerStats Service
@Injectable()
export class ArchivePlayerStatsService extends BaseService<PlayerStats> {
  constructor(
    @InjectModel(PlayerStats.name) playerStatsModel: Model<PlayerStats>,
    @InjectModel(ArchivePlayerStats.name) archivedPlayerStatsModel: Model<ArchivePlayerStats>,
  ) {
    super(playerStatsModel, archivedPlayerStatsModel);
  }
}

// Room Service
@Injectable()
export class ArchiveRoomService extends BaseService<Room> {
  constructor(
    @InjectModel(Room.name) roomModel: Model<Room>,
    @InjectModel(ArchiveRoom.name) archivedRoomModel: Model<ArchiveRoom>,
  ) {
    super(roomModel, archivedRoomModel);
  }
}

// Round Service
@Injectable()
export class ArchiveRoundService extends BaseService<Round> {
  constructor(
    @InjectModel(Round.name) roundModel: Model<Round>,
    @InjectModel(ArchiveRound.name) archivedRoundModel: Model<ArchiveRound>,
  ) {
    super(roundModel, archivedRoundModel);
  }
}

// ServerReceiverOnNet Service
@Injectable()
export class ArchiveServerReceiverOnNetService extends BaseService<ServerReceiverOnNet> {
  constructor(
    @InjectModel(ServerReceiverOnNet.name) serverReceiverOnNetModel: Model<ServerReceiverOnNet>,
    @InjectModel(ArchiveServerReceiverOnNet.name) archivedServerReceiverOnNetModel: Model<ArchiveServerReceiverOnNet>,
  ) {
    super(serverReceiverOnNetModel, archivedServerReceiverOnNetModel);
  }
}

// ServerReceiverSinglePlay Service
@Injectable()
export class ArchiveServerReceiverSinglePlayService extends BaseService<ServerReceiverSinglePlay> {
  constructor(
    @InjectModel(ServerReceiverSinglePlay.name) serverReceiverSinglePlayModel: Model<ServerReceiverSinglePlay>,
    @InjectModel(ArchiveServerReceiverSinglePlay.name) archivedServerReceiverSinglePlayModel: Model<ArchiveServerReceiverSinglePlay>,
  ) {
    super(serverReceiverSinglePlayModel, archivedServerReceiverSinglePlayModel);
  }
}

// Sponsor Service
@Injectable()
export class ArchiveSponsorService extends BaseService<Sponsor> {
  constructor(
    @InjectModel(Sponsor.name) sponsorModel: Model<Sponsor>,
    @InjectModel(ArchiveSponsor.name) archivedSponsorModel: Model<ArchiveSponsor>,
  ) {
    super(sponsorModel, archivedSponsorModel);
  }
}

// Team Service
@Injectable()
export class ArchiveTeamService extends BaseService<Team> {
  constructor(
    @InjectModel(Team.name) teamModel: Model<Team>,
    @InjectModel(ArchiveTeam.name) archivedTeamModel: Model<ArchiveTeam>,
  ) {
    super(teamModel, archivedTeamModel);
  }
}

// Template Service
@Injectable()
export class ArchiveTemplateService extends BaseService<Template> {
  constructor(
    @InjectModel(Template.name) templateModel: Model<Template>,
    @InjectModel(ArchiveTemplate.name) archivedTemplateModel: Model<ArchiveTemplate>,
  ) {
    super(templateModel, archivedTemplateModel);
  }
}

// User Service
@Injectable()
export class ArchiveUserService extends BaseService<User> {
  constructor(
    @InjectModel(User.name) userModel: Model<User>,
    @InjectModel(ArchiveUser.name) archivedUserModel: Model<ArchiveUser>,
  ) {
    super(userModel, archivedUserModel);
  }
}