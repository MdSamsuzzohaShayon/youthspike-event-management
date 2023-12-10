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
  ) {}

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
        updateUserId = dId;
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
        updateUserId = director._id;
      }

      // Update user -> set user id inside ldo
      const ldo = await this.ldoService.update({ name: args.name, logo: logoUrl }, updateUserId);

      return {
        code: 201,
        success: true,
        data: ldo,
      };
    } catch (err) {
      return AppResponse.getError(err);
    }
  }

  // Example ldoId = 6553d59680c96ec47a8a6eb0
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Query((returns) => GetDirectorLDOResponse)
  async getEventDirector(
    @Context() context: any,
    @Args({ name: 'dId', type: () => String, nullable: true }) dId?: string,
  ) {
    try {
      // If the user is admin we must need ldoId otherwise get id from token
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
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
