import { Test, TestingModule } from '@nestjs/testing';
import { PlayerRankingService } from './player-ranking.service';

describe('PlayerRankingService', () => {
  let service: PlayerRankingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerRankingService],
    }).compile();

    service = module.get<PlayerRankingService>(PlayerRankingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
