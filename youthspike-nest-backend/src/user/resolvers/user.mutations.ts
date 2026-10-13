import { HttpStatus, Injectable } from '@nestjs/common';

import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from './user.response';
import UserHelpers from './user.helpers';
import { AppResponse } from 'src/shared/response';
import { PlayerService } from 'src/player/player.service';
import { UpdateUser } from './user.input';
import { UserService } from '../user.service';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { rmInvalidProps } from 'src/utils/helper';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
const GraphQLUpload = GraphQLUploadModule.default;

type ObjectIdLike = Types.ObjectId | string;

@Injectable()
export class UserMutations {
  constructor(
    private readonly playerService: PlayerService,
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userHelpers: UserHelpers,
  ) { }




  async login(
    email: string,
    password: string,
    passcode?: string,
  ): Promise<LoginResponse> {
    try {
      // Step 1 — Resolve user (create on first login) & verify password.
      const user = await this.userHelpers.findOrCreateUser(email, password);
      if (!user) return AppResponse.invalidCredentials();

      const isPasswordValid = await this.userHelpers.verifyPassword(password, user.password);
      if (!isPasswordValid) return AppResponse.invalidCredentials();

      // Step 2 — Build the public-safe login payload skeleton.
      const loginUser = this.userHelpers.buildLoginUser(user);

      // Step 3 — Privileged roles (admin/director) skip team/event resolution.
      if (this.userHelpers.isPrivilegedRole(loginUser.role)) {
        return this.userHelpers.generateAuthResponse(
          user,
          loginUser,
          null,
          'Token issued successfully for admin/director',
        );
      }

      // Step 4 — Resolve the player id associated with the user's role.
      const playerId = this.userHelpers.extractPlayerId(loginUser);
      if (!playerId) return AppResponse.notFound('Player');

      // Step 5 — Pull every team this player is associated with (role-aware).
      const teams = await this.userHelpers.findTeamsByRole(loginUser.role, playerId);
      if (!teams?.length) return AppResponse.notFound('Team');

      // Step 6 — Make sure the underlying player document still exists.
      const player = await this.playerService.findById(playerId);
      if (!player) return AppResponse.notFound('Player');

      // Step 7 — Intersect player events with the union of team events.
      const teamEventIds = this.userHelpers.collectTeamEventIds(teams);
      const matchedEventIds = this.userHelpers.intersectEventIds(
        (player.events as string[]) ?? [],
        teamEventIds,
      );

      if (matchedEventIds.size === 0) {
        return AppResponse.handleError({
          code: HttpStatus.NOT_ACCEPTABLE, // 406 — matches original literal
          message: 'Player event and team event did not match',
        });
      }

      // Step 8 — Pick the team to surface (preferring the default-event team).
      const selectedTeam = await this.userHelpers.resolveTeamForDefaultEvent(
        teams,
        matchedEventIds,
      );
      this.userHelpers.attachTeamInfo(loginUser, selectedTeam);

      // Step 9 — If a passcode was supplied, validate it against matched events.
      const verifiedPasscode = passcode
        ? await this.userHelpers.validatePasscode(passcode, matchedEventIds)
        : undefined;

      // Step 10 — Sign JWT and assemble the final response payload.
      return this.userHelpers.generateAuthResponse(
        user,
        { ...loginUser, events: [...matchedEventIds] },
        verifiedPasscode,
      );
    } catch (error) {
      return this.userHelpers.handleInternalError(error);
    }
  }



  async updateUser(
    userId: string,
    updateInput: UpdateUser,
    profile?: Promise<FileUpload>,

  ) {
    try {
      const userExist = await this.userService.findById(userId);
      if (!userExist) return AppResponse.notFound('User');

      // Upload image to cloudinary
      let profileUrl: string | null = null;
      if (profile) profileUrl = await this.cloudinaryService.uploadFiles(profile);

      const userObj = rmInvalidProps(updateInput);
      const newUserObj = { ...userObj };
      if (newUserObj.password && updateInput.oldPassword) {
        const isValid = await bcrypt.compare(updateInput.oldPassword, userExist.password);
        delete newUserObj.oldPassword;
        if (isValid) {
          const salt = await bcrypt.genSalt(10);
          newUserObj.password = await bcrypt.hash(newUserObj.password, salt);
        } else {
          delete newUserObj.password;
        }
      } else {
        delete newUserObj.password;
      }
      if (profileUrl && userExist.captainplayer) {
        await this.playerService.updateOne({ _id: userExist.captainplayer.toString() }, { profile: profileUrl });
      }
      if (profileUrl && userExist.cocaptainplayer) {
        await this.playerService.updateOne({ _id: userExist.cocaptainplayer.toString() }, { profile: profileUrl });
      }

      if (newUserObj.email) delete newUserObj.email;
      const director = await this.userService.createOrUpdate(newUserObj, userId);
      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'The user has been updated successfully!',
        data: director,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


}
