/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Context, Field, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { LdoService } from 'src/ldo/ldo.service';
import { LDO } from './ldo.schema';
import { AppResponse } from 'src/shared/response';
import { User } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';
import { CreateDirectorArgs, UpdateDirectorArgs } from 'src/user/user.args';
import { UserRole } from 'src/user/user.schema';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import * as Upload from 'graphql-upload/Upload.js';
import * as bcrypt from 'bcrypt';
import { rmInvalidProps, tokenToUser } from 'src/util/helper';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { Roles } from 'src/shared/auth/roles.decorator';
import { ConfigService } from '@nestjs/config';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';

// @ObjectType()
// class GetPlayerResponse extends AppResponse<User> {
//   @Field((type) => User, { nullable: true })
//   data?: User;
// }

@ObjectType()
class GetDirectorLDOResponse extends AppResponse<LDO> {
  @Field((type) => LDO, { nullable: true })
  data?: LDO;
}

@ObjectType()
class GetDirectorsLDOResponse extends AppResponse<LDO[]> {
  @Field((type) => [LDO], { nullable: true })
  data?: LDO[];
}

@Resolver((of) => LDO)
export class LdoResolver {
  constructor(
    private configService: ConfigService,
    private ldoService: LdoService,
    private cloudinaryService: CloudinaryService,
    private userService: UserService,
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private matchService: MatchService,
    private roundsService: RoundService,
    private netService: NetService
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Mutation((returns) => GetDirectorLDOResponse)
  async createDirector(
    @Args('args') args: CreateDirectorArgs,
    @Context() context: any,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true }) logo?: Upload,
  ) {
    /**
     * Create LDO = Event Director Organization
     * Upload ldo logo image if there is a image
     * Create User as director
     */
    try {
      // Upload image to cloudinary
      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);

      const salt = await bcrypt.genSalt(10);
      const hashPwd = await bcrypt.hash(args.password, salt);

      const userObj = {
        firstName: args.firstName,
        lastName: args.lastName,
        role: UserRole.director,
        active: true,
        email: args.email,
        password: hashPwd
      };

      const director = await this.userService.createOrUpdate(userObj);
      const directorId = director._id;

      // Update user -> set user id inside ldo
      const ldo = await this.ldoService.create(
        { name: args.name, logo: logoUrl, events: [] },
        directorId,
        `${director.firstName} ${director.lastName} Event`,
      );

      return {
        code: 201,
        success: true,
        data: ldo,
      };
    } catch (err) {
      console.log(err);
      
      return AppResponse.getError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((returns) => GetDirectorLDOResponse)
  async updateDirector(
    @Args('args') args: UpdateDirectorArgs,
    @Context() context: any,
    @Args({ name: 'logo', type: () => GraphQLUpload, nullable: true })
    logo?: Upload,
    @Args({ name: 'dId', type: () => String, nullable: true }) dId?: string,
  ) {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const userId = tokenToUser(context, secret);
      if (!userId) return AppResponse.unauthorized();

      const loggedUser = await this.userService.findById(userId);
      if (!loggedUser) return AppResponse.unauthorized();

      // If the user is admin we must need ldoId otherwise get id from token
      let updateUserId = null;
      if (loggedUser.role === UserRole.director) {
        updateUserId = loggedUser._id;
      } else if (loggedUser.role === UserRole.admin && dId && dId !== '') {
        const ldo = await this.ldoService.findOne({
          $or: [{ director: dId.toString() }, { _id: dId.toString() }],
        });
        if(!ldo) return AppResponse.exists("LDO");
        updateUserId = ldo.director.toString();
      }

      // Upload image to cloudinary
      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);

      const userObj = {
        firstName: args.firstName,
        lastName: args.lastName,
        role: UserRole.director,
        active: true,
      };
      const newUserObj = rmInvalidProps(userObj);
      const loginObj: { password?: string; email?: string } = {};
      if (args.password) {
        const salt = await bcrypt.genSalt(10);
        loginObj.password = await bcrypt.hash(args.password, salt);
      }
      if (args.email) loginObj.email = args.email;

      if (loginObj.email || loginObj.password) newUserObj.login = loginObj;

      const director = await this.userService.createOrUpdate(newUserObj, updateUserId);
      if (director && director._id) {
        updateUserId = director._id.toString();
      }

      // Update user -> set user id inside ldo
      const updateObj: any = { name: args.name };
      if(logoUrl) updateObj.logo = logoUrl;
      const ldo = await this.ldoService.update(updateObj, updateUserId);

      return {
        code: 201,
        success: true,
        data: ldo,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Query((returns) => GetDirectorLDOResponse)
  async getEventDirector(
    @Context() context: any,
    @Args({ name: 'dId', type: () => String, nullable: true }) dId?: string,
  ) {
    try {
      // If the user is admin we must need ldoId otherwise get id from token
      if (dId) {
        const findDirector = await this.ldoService.findByDirectorId(dId);
        return {
          code: 200,
          success: true,
          data: findDirector,
        };
      }
      const secret = this.configService.get<string>('JWT_SECRET');
      const userId = tokenToUser(context, secret);
      if (!userId) return AppResponse.unauthorized();

      const loggedUser = await this.userService.findById(userId);
      if (!loggedUser) return AppResponse.unauthorized();

      // If the user is admin we must need ldoId otherwise get id from token
      let newUserId = null;
      if (loggedUser.role === UserRole.director) {
        newUserId = loggedUser._id;
      } else if (loggedUser.role === UserRole.admin && dId && dId !== '') {
        newUserId = dId;
      }

      if (!newUserId) return AppResponse.unauthorized();

      const ldo = await this.ldoService.findByDirectorId(newUserId);

      return {
        code: 200,
        success: true,
        data: ldo,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @Query((returns) => GetDirectorsLDOResponse)
  async getEventDirectors() {
    try {
      // If the user is admin we must need ldoId otherwise get id from token
      const ldo = await this.ldoService.query({ role: UserRole.director });
      return {
        code: 200,
        success: true,
        data: ldo,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Mutation((returns) => GetDirectorLDOResponse)
  async deleteEventDirector(
    @Context() context: any,
    @Args({ name: 'dId', type: () => String }) dId: string,
  ) {
    /**
     * Delete all events assosiated with it
     * Delete the user that is assosiated with it
     * Delete all teams, players, rounds, nets assosiated with it
     * Delete captain and players assosiated with it
     */
    try {
      const promisesToDelete = [];
      const ldo = await this.ldoService.findByDirectorId(dId);
      if (ldo && ldo.events && ldo.events.length > 0) {
        const ldoEventIds = ldo.events.map((le) => le.toString());
        promisesToDelete.push(this.eventService.delete({ _id: { $in: ldoEventIds } }));

        const events = await this.eventService.query({ _id: { $in: ldoEventIds } });
        if (events && events.length > 0) {
          for (const event of events) {
            // teams, players, matches
            if (event.teams && event.teams.length > 0) {
              const teamIds = event.teams.map((team) => team.toString());
              promisesToDelete.push(this.teamService.delete({ _id: { $in: teamIds } }));

              // captains
              const teams = await this.teamService.query({ _id: { $in: teamIds } });
              if (teams && teams.length > 0) {
                const captainPlayerIds = teams.filter(team => team.captain).map(team => team.captain.toString());
                promisesToDelete.push(this.userService.delete({ captainplayer: { $in: captainPlayerIds } }));
              }
            }
            if (event.players && event.players.length > 0) {
              const playerIds = event.players.map((player) => player.toString());
              promisesToDelete.push(this.playerService.delete({ _id: { $in: playerIds } }))
            }
            if (event.matches && event.matches.length > 0) {
              const matchIds = event.matches.map((match) => match.toString());
              promisesToDelete.push(this.matchService.delete({ _id: { $in: matchIds } }));

              // Rounds, nets
              const matches = await this.matchService.query({ _id: { $in: matchIds } });
              if (matches && matches.length > 0) {
                for (const match of matches) {
                  const roundIds = match.rounds.map(r => r.toString());
                  promisesToDelete.push(this.roundsService.delete({ _id: { $in: roundIds } }));

                  const netIds = match.nets.map(r => r.toString());
                  promisesToDelete.push(this.netService.delete({ _id: { $in: netIds } }));
                }
              }
            }
          }
        }
      }
      if (ldo && ldo.director) {
        promisesToDelete.push(this.ldoService.delete({ _id: ldo._id.toString() }));
        promisesToDelete.push(this.userService.delete({ _id: ldo.director.toString() }));
      }

      await Promise.all(promisesToDelete);
      return {
        code: 204,
        success: true,
        data: ldo,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  // Assuming "director" is a string representing the ID of the director user
  @ResolveField((returns) => User) // Assuming UserType is your GraphQL type for users
  async director(@Parent() ldo: LDO) {
    const userId = ldo.director; // Assuming director property holds the user ID
    return this.userService.findById(userId.toString());
  }

  @ResolveField()
  async events(@Parent() ldo: LDO) {
    const events = await this.eventService.query({ ldo: ldo._id.toString() });
    return events;
  }
}
