import { TeamService } from 'src/team/team.service';

// import { ITeamQueries } from '../resolvers/event.types';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user.service';
import { AppResponse } from 'src/shared/response';

// ITeamQueries

@Injectable()
export class UserQueries {
  constructor(
    private userService: UserService,
    private teamService: TeamService,
  ) { }


  async getUser(userId: string) {
    try {
      const userExist: any = await this.userService.findById(userId);
      if (!userExist) return AppResponse.notFound('User');
      const userObj = { ...userExist };
      delete userObj.password;
      return {
        code: HttpStatus.OK,
        success: true,
        data: userObj,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }
}
