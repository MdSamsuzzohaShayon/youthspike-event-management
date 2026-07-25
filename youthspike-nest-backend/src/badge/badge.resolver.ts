import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { EventService } from 'src/event/event.service';
import { PlayerService } from 'src/player/player.service';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import { AppResponse } from 'src/shared/response';
import { TeamService } from 'src/team/team.service';
import { BadgeService } from './badge.service';
import { LdoService } from 'src/ldo/ldo.service';
import { UserService } from 'src/user/user.service';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from 'src/template/template.service';

@Resolver()
export class BadgeResolver {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private emailSenderService: BadgeService,
    private ldoService: LdoService,
    private userService: UserService,
    private templateService: TemplateService,
    private configService: ConfigService,
  ) { }

  // ── Mutation ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => AppResponse)
  async createBadge(
    @Context() context: any,
    @Args('eventId') eventId: string,
  ): Promise<AppResponse> {
    try {
     
      return {
        code: HttpStatus.OK,
        message: 'Credentials have been sent via email',
        success: true,
      };
    } catch (error) {
      console.error('[BadgeResolver] sendCredentials error:', error);
      return AppResponse.handleError(error);
    }
  }
}