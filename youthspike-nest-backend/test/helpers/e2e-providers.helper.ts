import { ConfigService } from '@nestjs/config';
import { TeamService } from '../../src/team/team.service';
import { LdoService } from '../../src/ldo/ldo.service';
import { PlayerService } from '../../src/player/player.service';
import { PlayerStatsService } from '../../src/player-stats/player-stats.service';
import { MatchService } from '../../src/match/match.service';
import { UserService } from '../../src/user/user.service';
import { SponsorService } from '../../src/sponsor/sponsor.service';
import { GroupService } from '../../src/group/group.service';
import { RoomService } from '../../src/room/room.service';
import { RoundService } from '../../src/round/round.service';
import { NetService } from '../../src/net/net.service';
import { PlayerRankingService } from '../../src/player-ranking/player-ranking.service';
import { TemplateService } from '../../src/template/template.service';
import { BadgeService } from '../../src/badge/badge.service';
import { EmailsenderService } from '../../src/emailsender/emailsender.service';
import { CloudinaryService } from '../../src/shared/services/cloudinary.service';
import { ServerReceiverOnNetService } from '../../src/server-receiver-on-net/server-receiver-on-net.service';
import {
  ArchiveBadgeService, ArchiveEmailcontentService, ArchiveEmailsenderService, ArchiveEventService,
  ArchiveGroupService, ArchiveMatchService, ArchiveNetService, ArchivePlayerRankingItemService,
  ArchivePlayerRankingService, ArchivePlayerStatsService, ArchiveRoomService, ArchiveRoundService,
  ArchiveServerReceiverOnNetService, ArchiveServerReceiverSinglePlayService, ArchiveSponsorService,
  ArchiveTeamService, ArchiveTemplateService,
} from '../../src/archive/archive.service';

import {
  mockTeamService, mockLdoService, mockPlayerService, mockPlayerStatsService,
  mockMatchService, mockUserService, mockSponsorService, mockGroupService, mockRoomService,
  mockRoundService, mockNetService, mockPlayerRankingService, mockTemplateService, mockBadgeService,
  mockEmailsenderService, mockCloudinaryService, mockConfigService, mockArchiveServices,
  mockServerReceiverOnNetService,
} from '../mocks/services.mock';

export function getE2EMockProviders() {
  const archives = mockArchiveServices();

  return [
    { provide: ConfigService, useValue: mockConfigService() },
    { provide: TeamService, useValue: mockTeamService() },
    { provide: LdoService, useValue: mockLdoService() },
    { provide: PlayerService, useValue: mockPlayerService() },
    { provide: PlayerStatsService, useValue: mockPlayerStatsService() },
    { provide: MatchService, useValue: mockMatchService() },
    { provide: UserService, useValue: mockUserService() },
    { provide: SponsorService, useValue: mockSponsorService() },
    { provide: GroupService, useValue: mockGroupService() },
    { provide: RoomService, useValue: mockRoomService() },
    { provide: RoundService, useValue: mockRoundService() },
    { provide: NetService, useValue: mockNetService() },
    { provide: PlayerRankingService, useValue: mockPlayerRankingService() },
    { provide: TemplateService, useValue: mockTemplateService() },
    { provide: BadgeService, useValue: mockBadgeService() },
    { provide: EmailsenderService, useValue: mockEmailsenderService() },
    { provide: CloudinaryService, useValue: mockCloudinaryService() },
    { provide: ServerReceiverOnNetService, useValue: mockServerReceiverOnNetService() },
    { provide: ArchiveTeamService, useValue: archives.archiveTeamService },
    { provide: ArchiveMatchService, useValue: archives.archiveMatchService },
    { provide: ArchiveGroupService, useValue: archives.archiveGroupService },
    { provide: ArchiveSponsorService, useValue: archives.archiveSponsorService },
    { provide: ArchiveTemplateService, useValue: archives.archiveTemplateService },
    { provide: ArchivePlayerStatsService, useValue: archives.archivePlayerStatsService },
    { provide: ArchiveNetService, useValue: archives.archiveNetService },
    { provide: ArchivePlayerRankingService, useValue: archives.archivePlayerRankingService },
    { provide: ArchivePlayerRankingItemService, useValue: archives.archivePlayerRankingItemService },
    { provide: ArchiveRoomService, useValue: archives.archiveRoomService },
    { provide: ArchiveRoundService, useValue: archives.archiveRoundService },
    { provide: ArchiveServerReceiverOnNetService, useValue: archives.archiveServerReceiverOnNetService },
    { provide: ArchiveServerReceiverSinglePlayService, useValue: archives.archiveServerReceiverSinglePlayService },
    { provide: ArchiveEventService, useValue: archives.archiveEventService },
    { provide: ArchiveBadgeService, useValue: archives.archiveBadgeService },
    { provide: ArchiveEmailsenderService, useValue: archives.archiveEmailsenderService },
    { provide: ArchiveEmailcontentService, useValue: archives.archiveEmailcontentService },
  ];
}