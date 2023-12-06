/* eslint-disable @typescript-eslint/no-unused-vars */
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { TeamService } from 'src/team/team.service';
import { Coach, User } from './user.schema';

@Resolver((of) => Coach)
export class CoachResolver {
  constructor(private teamService: TeamService) { }

  @ResolveField()
  async team(@Parent() coach: User) {
    try {
      return this.teamService.findOne({
        coachId: coach._id,
      });
    } catch {
      return null;
    }
  }
}
