import { Test, TestingModule } from '@nestjs/testing';
import { PlayerStatsResolver } from './player-stats.resolver';
import { PlayerStatsService } from './player-stats.service';

describe('PlayerStatsResolver', () => {
  let resolver: PlayerStatsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerStatsResolver, PlayerStatsService],
    }).compile();

    resolver = module.get<PlayerStatsResolver>(PlayerStatsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
